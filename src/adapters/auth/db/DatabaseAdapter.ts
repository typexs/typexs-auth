//import * as passport from "passport";
import * as bcrypt from "bcrypt";
import * as _ from "lodash";

import {ConnectionWrapper, Inject, StorageRef, NestedException} from "@typexs/base";
import {AuthMethod} from "../../../entities/AuthMethod";
import {UserNotFoundError} from "../../../libs/exceptions/UserNotFoundError";
import {PasswordIsWrongError} from "../../../libs/exceptions/PasswordIsWrongError";
import {DefaultUserLogin} from "../../../libs/models/DefaultUserLogin";
import {IDatabaseAuthOptions} from "./IDatabaseAuthOptions";
import {AbstractAuthAdapter} from "../../../libs/adapter/AbstractAuthAdapter";

import {DefaultUserSignup} from "../../../libs/models/DefaultUserSignup";

import {User} from "../../../entities/User";
import {EntityController} from "@typexs/schema";
import {AuthDataContainer} from "../../../libs/auth/AuthDataContainer";


export const K_AUTH_DATABASE = 'database';


const DEFAULTS: IDatabaseAuthOptions = {

  type: K_AUTH_DATABASE,

  /**
   * Database auth can't support create on login
   */
  createOnLogin: false,

  allowSignup: true,

  saltRound: 5

};


export class DatabaseAdapter extends AbstractAuthAdapter {


  @Inject('storage.default')
  storage: StorageRef;

  @Inject('EntityController.default')
  entityController: EntityController;

  connection: ConnectionWrapper;

  type: string = K_AUTH_DATABASE;

  options: IDatabaseAuthOptions;


  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(opts: IDatabaseAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);
    this.connection = await this.storage.connect();
  }


  async authenticate(container: AuthDataContainer<DefaultUserLogin>) {

    try {
      let authMethod = await this.getAuth(container.instance);
      if (authMethod) {
        container.success = true;
        container.user = await this.entityController.find(User, {id: authMethod.userId}, {limit: 1});
        return true;
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err instanceof PasswordIsWrongError) {
          // TODO handle error messages in error classes and not here
          container.addError({
            property: "password", // Object's property that haven't pass validation.
            value: "password", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "username or password is wrong."
            }
          });
        } else if (err instanceof UserNotFoundError) {
          // TODO handle error messages in error classes and not here
          container.addError({
            property: "username", // Object's property that haven't pass validation.
            value: "username", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "username not found"
            }
          });
        } else {
          throw err;
        }
      } else {
        throw new NestedException(err, "UNKNOWN");
      }
    }
    return false;
  }


  async signup(data: DefaultUserSignup) {
    // TODO impl method
    return true;
  }


  async crypt(str: string) {
    return bcrypt.hash(str, this.options.saltRound);
  }

  async cryptCompare(str: string, secret: string) {
    return bcrypt.compare(str, secret);
  }

  async extend(obj: User | AuthMethod, data: any): Promise<void> {
    if (obj instanceof AuthMethod && data instanceof DefaultUserSignup) {
      obj.secret = data.password ? await this.crypt(data.password) : null;
    }
  }

  async getAuth(login: DefaultUserLogin): Promise<AuthMethod> {

    let username = login.username;
    let password = login.password;

    let authMethod = await this.connection.manager.findOne(AuthMethod,
      {
        where:
          {
            identifier: username,
            authId: this.authId,
            type: this.type
          }
      });

    if (!authMethod) {
      throw new UserNotFoundError(username);
    }
    // TODO: if password was  wrongly submitted multiple times then disable account and inform user
    // TODO: if disabled the admin should be contacted for re-enabling

    let equal = await this.cryptCompare(password, authMethod.secret);
    if (!equal) {
      authMethod.failed += 1;
      await this.connection.save(authMethod);
      throw new PasswordIsWrongError(username);
    }

    authMethod.failed = 0;
    await this.connection.save(authMethod);

    return authMethod;
  }


}
