//import * as passport from "passport";
import * as bcrypt from "bcrypt";
import * as _ from "lodash";
import {Strategy as LocalStrategy} from "passport-local";
import {IAuthOptions} from "../../middleware/Auth";
import {IAuthAdapter} from "../../libs/IAuthAdapter";
import {ConnectionWrapper, Inject, StorageRef} from "typexs-base";
import {AuthMethod} from "../../entities/AuthMethod";
import {UserNotFoundError} from "../../libs/exceptions/UserNotFoundError";
import {PasswordIsWrongError} from "../../libs/exceptions/PasswordIsWrongError";
import {AuthUserSignup} from "../../libs/models/AuthUserSignup";
import {AuthLifeCycle} from "../../types";
import {AuthUserLogin} from "../../libs/models/AuthUserLogin";

export const K_AUTH_DATABASE = 'database';

export interface IDatabaseAuthOptions extends IAuthOptions {
  usernameField?: string;

  passwordField?: string;

  passReqToCallback?: boolean;

  badRequestMessage?: string;

  saltRound?: number;

}

const DEFAULTS: IDatabaseAuthOptions = {
  type: 'database',
  passReqToCallback: false,
  usernameField: 'username',
  passwordField: 'password',
  saltRound: 5
};


export class DatabaseAdapter implements IAuthAdapter {


  @Inject('storage.default')
  storage: StorageRef;

  connection: ConnectionWrapper;

  type: string = K_AUTH_DATABASE;

  identifier: string = null;

  strategy: LocalStrategy;


  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(passport: any, opts: IDatabaseAuthOptions) {
    _.defaults(opts, DEFAULTS);
    this.connection = await this.storage.connect();
    //  this.strategy = new LocalStrategy(<IStrategyOptions>opts, opts.passReqToCallback ? this.verifyReq.bind(this) : this.verify.bind(this));
    // passport.use(this.strategy);
  }

  async authenticate(login: AuthUserLogin) {
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
            exists: "$property or username is wrong."
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

  /*
    async verify(username: string, password: string, verified: (err: Error, user?: AuthUser, info?: any) => void) {
      try {
        let user = await this.findUser(username, password);
        verified(null, user);
      } catch (err) {
        verified(err);
      }
    }


    async verifyReq(req: Request, username: string, password: string, verified: (err: Error, user: AuthUser, info: any) => void) {
      await this.verify(username, password, verified);
    }
  */

  async getAuth(login: AuthUserLogin): Promise<AuthMethod> {

    let username = login.username;
    let password = login.password;

    let auth = await this.connection.manager.findOne(AuthMethod,
      {where: {username: username, identifier: this.identifier, type: K_AUTH_DATABASE}, relations: ["user"]});
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


  getModelFor(lifecycle: AuthLifeCycle) {
    switch (lifecycle) {
      case "login":
        return AuthUserLogin;
      case "signup":
        return AuthUserSignup;
    }
    throw new Error("No model for lifecycle " + lifecycle + ' in ' + this.identifier);
  }


}
