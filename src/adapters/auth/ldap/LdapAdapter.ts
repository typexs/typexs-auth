//import * as passport from "passport";
import * as _ from "lodash";
import {AuthMethod} from "../../../entities/AuthMethod";
import {DefaultUserLogin} from "../../../libs/models/DefaultUserLogin";
import {AbstractAuthAdapter} from "../../../libs/adapter/AbstractAuthAdapter";
import {AbstractInputData} from "../../../libs/models/AbstractInputData";
import {AuthUser} from "../../../entities/AuthUser";
import {ILdapAuthOptions} from "./ILdapAuthOptions";
import LdapAuth = require("ldapauth-fork");

import {Log, NestedException} from "typexs-base";
import {AbstractUserLogin} from "../../../libs/models/AbstractUserLogin";

export const K_AUTH_LDAP = 'ldap';


const DEFAULTS: ILdapAuthOptions = {

  type: K_AUTH_LDAP,

  url: "ldap://localhost:389",


  uidAttr: 'uid',

  mailAttr: 'mail',

  /**
   * The base DN from which to search for users by username.
   * E.g. ou=users,dc=example,dc=org
   */
  searchBase: 'ou=users,dc=example,dc=org',

  /**
   * LDAP search filter with which to find a user by username, e.g.
   * (uid={{username}}). Use the literal {{username}} to have the
   * given username interpolated in for the LDAP search.
   */
  searchFilter: '(uid={{username}})',

  /**
   * Ldap auth support create on login
   */
  createOnLogin: true,

  /**
   * Ldap auth doesn't support creation of accounts in ldap
   */
  allowSignup: false,


  reconnect: true

};


export class LdapAdapter extends AbstractAuthAdapter {


  type: string = K_AUTH_LDAP;

  options: ILdapAuthOptions;

  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(opts: ILdapAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);
  }


  async authenticate(login: DefaultUserLogin): Promise<boolean> {
    let ldap = new LdapAuthPromise(this.options);
    try {
      login.isAuthenticated = await ldap.authenticate(login.username, login.password);
      if (login.isAuthenticated) {
        login.data = ldap.user;
        login.success = login.isAuthenticated;
      } else {
        Log.info('EERR', ldap.error);
      }
    } catch (err) {
      Log.error(ldap.error);
      if (_.isString(ldap.error)) {
        if (/no such user/.test(ldap.error)) {
          // TODO handle error messages in error classes and not here
          // TODO ISSUE
          login.addError({
            property: "username", // Object's property that haven't pass validation.
            value: "username", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "username not found"
            }
          })
        } else {
          throw new NestedException(new Error(), "UNKNOWN");
        }
      } else if (ldap.error instanceof Error) {

        if (/Invalid Credentials/.test(ldap.error.message)) {
          // TODO handle error messages in error classes and not here
          login.addError({
            property: "password", // Object's property that haven't pass validation.
            value: "password", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "username or password is wrong."
            }
          });

        } else {
          throw new NestedException(ldap.error, "UNKNOWN");
        }

      } else {
        throw new NestedException(err, "UNKNOWN");
      }


    } finally {
      await ldap.close();
    }
    return login.isAuthenticated;

  }

  /*
    async signup(data: DefaultUserSignup) {
      // TODO impl method
      return false;
    }
  */


  createOnLogin(login: DefaultUserLogin): boolean {
    let ldapData = login.data;
    let mail = null;
    if (_.has(ldapData, this.options.mailAttr)) {
      // set mail field @see Auth.ts:createUser
      mail = _.get(ldapData, this.options.mailAttr)
    }

    if (_.isNull(login.data) || _.isNull(mail)) {
      login.addError({
        property: 'mail is not present',
        value: 'mail',
        constraints: {no_mail_address: 'No mail address'}
      });
      return false;
    }


    login.data.mail = mail;

    return true;
  }


  async extend(obj: AuthUser | AuthMethod, data: AbstractInputData): Promise<void> {

  }

}


class LdapAuthPromise {
  ldap: LdapAuth;

  user: any = {};

  success: boolean = false;

  error: Error | string = null;

  constructor(options: ILdapAuthOptions) {
    this.ldap = new LdapAuth(options);
  }


  async authenticate(username: string, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.ldap.authenticate(username, password, (error: Error | string, result?: any) => {
        if (error) {
          this.error = error;
          reject(false)
        } else {
          this.user = result;
          this.success = true;
          resolve(true)
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.ldap.close((err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }

}
