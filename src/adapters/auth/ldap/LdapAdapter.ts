//import * as passport from "passport";
import * as _ from "lodash";
import {AuthMethod} from "../../../entities/AuthMethod";
import {DefaultUserLogin} from "../../../libs/models/DefaultUserLogin";
import {AbstractAuthAdapter} from "../../../libs/adapter/AbstractAuthAdapter";

import {ILdapAuthOptions} from "./ILdapAuthOptions";

import {Log, NestedException} from "@typexs/base";
import {User} from "../../../entities/User";
import {AuthDataContainer} from "../../../libs/auth/AuthDataContainer";

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


  reconnect: true,

  timeout: 5000,

//  connectTimeout: 5000,


};


export class LdapAdapter extends AbstractAuthAdapter {

  static clazz: Function;

  type: string = K_AUTH_LDAP;

  options: ILdapAuthOptions;

  hasRequirements() {
    try{
      if(!LdapAdapter.clazz){
        LdapAdapter.clazz = require('./LdapAuthPromise').LdapAuthPromise;
      }
    }catch(ex){
      return false;
    }
    return true;
  }


  async prepare(opts: ILdapAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);
  }


  async authenticate(container: AuthDataContainer<DefaultUserLogin>): Promise<boolean> {
    let ldap = Reflect.construct(LdapAdapter.clazz,[this.options]);
    try {
      let login = container.instance;
      container.isAuthenticated = await ldap.authenticate(login.username, login.password);
      if (container.isAuthenticated) {
        container.data = ldap.user;
        container.success = container.isAuthenticated;
      } else {
        Log.info('EERR', ldap.error);
      }
    } catch (err) {
      Log.error(ldap.error);
      if (_.isString(ldap.error)) {
        if (/no such user/.test(ldap.error)) {
          // TODO handle error messages in error classes and not here
          // TODO ISSUE
          container.addError({
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

        if (/Invalid Credentials/.test(ldap.error.lde_message)) {
          // TODO handle error messages in error classes and not here
          container.addError({
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
      //if(!_.get(this.options,'reconnect',false)){
        await ldap.close();
      //}
    }
    return container.isAuthenticated;
  }


  createOnLogin(login: AuthDataContainer<DefaultUserLogin>): boolean {
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


}
