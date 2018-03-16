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

import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {AbstractInputData} from "../../libs/models/AbstractInputData";
import {AuthUser} from "../../entities/AuthUser";

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

  options:IDatabaseAuthOptions;


  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(opts: IDatabaseAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);
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



  async extend(obj:AuthUser | AuthMethod, data: AbstractInputData):Promise<void>{
    if(obj instanceof AuthMethod && data instanceof DefaultUserSignup){
      obj.secret = data.password ? await bcrypt.hash(data.password, this.options.saltRound) : null;
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
