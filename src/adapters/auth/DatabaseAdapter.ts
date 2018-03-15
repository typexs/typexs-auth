//import * as passport from "passport";
import * as bcrypt from "bcrypt";
import * as _ from "lodash";

import {ConnectionWrapper, Inject, StorageRef} from "typexs-base";
import {AuthMethod} from "../../entities/AuthMethod";
import {UserNotFoundError} from "../../libs/exceptions/UserNotFoundError";
import {PasswordIsWrongError} from "../../libs/exceptions/PasswordIsWrongError";

import {AuthLifeCycle} from "../../types";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {IDatabaseAuthOptions} from "./db/IDatabaseAuthOptions";
import {AbstractAuthAdapter} from "../../libs/adapter/AbstractAuthAdapter";
import {IAuthData} from "../../libs/adapter/IAuthData";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";

export const K_AUTH_DATABASE = 'database';


const DEFAULTS: IDatabaseAuthOptions = {
  type: 'database',
  /*
  passReqToCallback: false,
  usernameField: 'authId',
  passwordField: 'password',
  */
  saltRound: 5
};


export class DatabaseAdapter extends AbstractAuthAdapter {


  @Inject('storage.default')
  storage: StorageRef;

  connection: ConnectionWrapper;

  type: string = K_AUTH_DATABASE;


  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(opts: IDatabaseAuthOptions) {
    _.defaults(opts, DEFAULTS);
    this.connection = await this.storage.connect();
  }

  async authenticate(login: DefaultUserLogin) {
    try {
      let authMethod = await this.getAuth(login);
      if (authMethod) {
        login.success = true;
        login.user = authMethod.user;
        return true;
      }
    } catch (err) {
      if (err instanceof PasswordIsWrongError) {
        login.errors = [{
          property: "password", // Object's property that haven't pass validation.
          value: "password", // Value that haven't pass a validation.
          constraints: { // Constraints that failed validation with error messages.
            exists: "$property or authId is wrong."
          }
        }];
      } else if (err instanceof UserNotFoundError) {
        login.errors = [{
          property: "username", // Object's property that haven't pass validation.
          value: "username", // Value that haven't pass a validation.
          constraints: { // Constraints that failed validation with error messages.
            exists: "$property not found."
          }
        }];
      } else {
        throw err;
      }

    }
    return false;

  }


  async signup(data:DefaultUserSignup){
    // TODO impl method
    return true;
  }


  extractAccessData(data: DefaultUserLogin | DefaultUserSignup): IAuthData {
    return {
      identifier:data.username,
      secret: data.password,
      mail: data instanceof DefaultUserSignup ? data.mail : null,
      data: data.data ? data.data : null
    }
  }


  async getAuth(login: DefaultUserLogin): Promise<AuthMethod> {

    let username = login.username;
    let password = login.password;

    let auth = await this.connection.manager.findOne(AuthMethod,
      {
        where:
          {
            username: username,
            identifier: this.authId,
            type: this.type
          },
        relations: ["user"]
      });

    if (!auth) {
      throw new UserNotFoundError(username);
    }
    // TODO: if password was  wrongly submitted multiple times then disable account and inform user
    // TODO: if disabled the admin should be contacted for re-enabling

    let equal = await bcrypt.compare(password, auth.secret);
    if (!equal) {
      auth.failed += 1;
      await this.connection.save(auth);
      throw new PasswordIsWrongError(username);
    }

    auth.failed = 0;
    await this.connection.save(auth);

    return auth;
  }


}
