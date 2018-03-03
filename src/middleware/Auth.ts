import *  as passport from 'passport';
import {
  Config, Inject, RuntimeLoader, ClassesLoader, StorageRef, Container, CryptUtils,
  ConnectionWrapper, Log
} from 'typexs-base';
import {Action, IApplication, IMiddleware, IRoutingController, K_ROUTE_CONTROLLER} from 'typexs-server';
import {AuthLifeCycle, K_LIB_AUTH_ADAPTERS} from "../types";
import * as _ from 'lodash';
import {AuthUser} from "../entities/AuthUser";
import {AuthSession} from "../entities/AuthSession";
import {IAuthAdapter} from "../libs/IAuthAdapter";
import {AuthMethod} from "../entities/AuthMethod";
import {EmptyHttpRequestError} from "../libs/exceptions/EmptyHttpRequestError";
import {validate} from "class-validator";
import * as bcrypt from "bcrypt";
import {BadRequestError} from "routing-controllers";
import {log} from "util";


export interface IAuthOptions {
  type: string

  identifier?: string;

  clazz?: Function

}

export interface ISessionOptions {
  secret?: string;
}

export interface IAuthConfig {

  httpAuthKey?: string;

  allowRegistration: true;

  saltRounds?: number;

  session?: ISessionOptions;

  userClass?: string | Function

  methods?: { [key: string]: IAuthOptions }

}

export interface IAdapterDef {
  name: string;
  moduleName: string;
  className: string;
  filepath: string;
}

const DEFAULT_CONFIG_OPTIONS = {
  httpAuthKey: 'txs-auth',
  allowRegistration: false,
  saltRounds: 5,
  userClass: AuthUser,
  session: {
    secret: CryptUtils.shorthash(new Date() + ''),
    resave: true,
    saveUninitialized: true
  }
};


export class Auth implements IMiddleware {


  @Inject('RuntimeLoader')
  private loader: RuntimeLoader;

  @Inject('storage.default')
  private storage: StorageRef;

  private connection: ConnectionWrapper;

  private authConfig: IAuthConfig;

  private allAdapters: IAdapterDef[] = [];

  private adapters: IAuthAdapter[] = [];

  private frameworkId: string;

  private enabled: boolean = false;


  // support currently only express
  validate(cfg: any): boolean {
    if (cfg.type == 'web' && cfg.framework === 'express') {
      this.frameworkId = cfg.framework;
      return true;
    }
    return false;
  }


  async prepare(opts: any) {
    Container.set("Auth", this);
    let x = Config.get("auth");
    this.authConfig = <IAuthConfig>x;
    _.defaults(this.authConfig, DEFAULT_CONFIG_OPTIONS);

    let classes = this.loader.getClasses(K_LIB_AUTH_ADAPTERS);

    for (let cls of classes) {
      let obj = <IAuthAdapter>Reflect.construct(cls, []);

      if (obj.type) {
        let def: IAdapterDef = {
          className: cls.name,
          filepath: ClassesLoader.getSource(cls),
          moduleName: ClassesLoader.getModulName(cls),
          name: obj.type
        };

        if (!_.isEmpty(this.authConfig) && !_.isEmpty(this.authConfig.methods)) {
          for (let identifier in this.authConfig.methods) {
            let methodOptions = this.authConfig.methods[identifier];
            methodOptions.identifier = identifier;
            if (methodOptions.type === obj.type) {
              methodOptions.clazz = cls;
              let adapterInstance = <IAuthAdapter>Container.get(cls);
              adapterInstance.identifier = identifier;
              this.adapters.push(adapterInstance);
              await adapterInstance.prepare(passport, methodOptions);
            }
          }
        }
        this.allAdapters.push(def);
      }
    }
    this.enabled = !_.isEmpty(this.authConfig) && _.keys(this.authConfig.methods).length > 0
    if (this.isEnabled()) {
      this.connection = await this.storage.connect();
    }
  }


  isEnabled() {
    return this.enabled;
  }


  getHttpAuthKey() {
    return this.authConfig.httpAuthKey.toLocaleLowerCase();
  }


  getDefinedAdapters(): IAdapterDef[] {
    return this.allAdapters;
  }


  getUsedAuthMethods(): IAuthOptions[] {
    if (!_.isEmpty(this.authConfig)) {
      return _.values(this.authConfig.methods);
    }
    return [];
  }


  getAdapters(): IAuthAdapter[] {
    return this.adapters;
  }

  getAdapterByIdentifier(identifier: string): IAuthAdapter {
    return _.find(this.getAdapters(), a => a.identifier === identifier);
  }


  extendOptions(options: any) {
    if (options.type === K_ROUTE_CONTROLLER) {
      (<IRoutingController>options).authorizationChecker = this.authorizationChecker.bind(this);
      (<IRoutingController>options).currentUserChecker = this.currentUserChecker.bind(this);
    }
  }

  private getInstanceFor(stage: AuthLifeCycle, identifier: string = 'default', values: any = null): any {
    let adapter = this.getAdapterByIdentifier(identifier);
    if (adapter && adapter.getModelFor(stage)) {
      let clazz = adapter.getModelFor(stage);
      let signup = Reflect.construct(clazz, []);
      if (values) {
        _.assign(signup, values);
      }
      signup.identifier = identifier;
      return signup;
    }
    return null;
  }


  getInstanceForSignup(identifier: string = 'default', values: any = null): any {
    return this.getInstanceFor("signup", identifier, values);
  }

  getInstanceForLogin(identifier: string = 'default', values: any = null): any {
    return this.getInstanceFor("login", identifier, values);
  }

  async doSignup(signup: any, req: any, res: any) {
    if (!_.isEmpty(signup)) {
      let id = _.get(signup, "identifier", "default");
      signup = this.getInstanceForSignup(id, signup);
      let errors = await validate(signup, {validationError: {target: false}});
      if (_.isEmpty(errors)) {
        // everything is okay
        // check if username for type is already given
        let adapter = this.getAdapterByIdentifier(id);

        // TODO normalize username like adapter.normalize(username);
        let mgr = this.connection.manager;
        let [authMethod, authUser] = await Promise.all([
          mgr.findOne(AuthMethod, {
            where: {
              identifier: adapter.identifier,
              username: signup.username
            }
          }), mgr.findOne(AuthUser, {
            where: {
              username: signup.username
            }
          })
        ]);

        if (_.isEmpty(authMethod) && _.isEmpty(authUser)) {
          // create method first then user
          // TODO impl. adapter method to generate entry
          try {
            await mgr.transaction(async em => {
              let method = new AuthMethod();
              method.username = signup.username;
              method.identifier = signup.identifier;
              method.secret = await bcrypt.hash(signup.password, this.authConfig.saltRounds);
              method.type = adapter.type;
              method.mail = signup.mail;
              method = await mgr.save(method);

              let user = new AuthUser();
              user.username = signup.username;
              user.mail = signup.mail;
              user.preferedMethod = method;
              user = await mgr.save(user);

              method.user = user;
              method = await mgr.save(method);
            });

          } catch (err) {
            // TODO
            Log.error(err);
            throw new BadRequestError(err.message);
          }

          // TODO: auto sign in
          // TODO: verify mail
          signup.password = null;
          signup.success = true;
          return signup;

        } else {
          signup.password = null;
          signup.errors = [{
            property: "username", // Object's property that haven't pass validation.
            value: "username", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "$property already assigned."
            }
          }];
          return signup;
        }

      } else {
        signup.password = null;
        signup.errors = errors;
        return signup;
      }
    } else {
      throw new EmptyHttpRequestError();
    }
  }


  async doLogin(login: any, req: any, res: any) {
    // if logged in
    // passport.authenticate()
    let isAuthenticated = await this.isAuthenticated(req);
    if (isAuthenticated) {
      login.isAuthenticated = isAuthenticated;
      delete login.password;
      return login;
    } else {

      if (!_.isEmpty(login)) {
        let id = _.get(login, "identifier", "default");
        login = this.getInstanceForLogin(id, login);
        let errors = await validate(login, {validationError: {target: false}});
        if (_.isEmpty(errors)) {
          // everything is okay
          // check if username for type is already given
          let adapter = this.getAdapterByIdentifier(id);

          isAuthenticated = await adapter.authenticate(login);
          if (isAuthenticated) {
            let mgr = this.connection.manager;

            let authMethod = await adapter.getAuth(login);
            let authUser = authMethod.user;

            try {
              await mgr.transaction(async em => {
                let q =  em.createQueryBuilder(AuthSession, "s").delete().where("userId = :userId", {userId: authUser.id});
                await q.execute();
                let session = new AuthSession();
                session.ip = req.connection.remoteAddress;
                session.user = authUser;
                session.authMethod = authMethod;
                session.token = CryptUtils.shorthash(new Date().getTime() + '' + session.ip);
                await em.save(session);
                res.setHeader(this.getHttpAuthKey(), session.token);
              });
              delete login.password;
              login.isAuthenticated = isAuthenticated;
              login.success = true;
              return login;
            } catch (err) {
              throw err;
            }
          }
        }

        login.isAuthenticated = isAuthenticated;
        delete login.password;
        return login;

      } else {
        throw new EmptyHttpRequestError();
      }
    }
  }


  async doLogout(user: AuthUser, req: any, res: any) {
    const token = this.getToken(req);
//    let c = await this.storage.connect();
//    let session = await c.manager.findOneById(AuthSession, token);
  }


  getToken(req: any) {
    return req.headers[this.getHttpAuthKey()];
  }


  async isAuthenticated(req: any): Promise<boolean> {
    if (this.isEnabled()) {
      const token = this.getToken(req);

      if (!_.isEmpty(token)) {
        let session = await this.getSessionByToken(token);
        if (!_.isEmpty(session)) {
          // TODO check roles
          let user = session.user;

          await Promise.all([
            this.connection.manager.save(user),
            this.connection.manager.save(session)
          ]);

          return true;
        }
      }
      return false;
    }
    return true;
  }


  // (action: Action, roles: any[]) => Promise<boolean> | boolean;
  async authorizationChecker(action: Action, roles: any[]): Promise<boolean> {
    return this.isAuthenticated(action.request);
  }


  // (action: Action) => Promise<any> | any;
  async currentUserChecker(action: Action): Promise<any> {
    if (this.isEnabled()) {
      const token = this.getToken(action.request);
      let session = await this.getSessionByToken(token);
      if (!_.isEmpty(session)) {
        return session.user;
      }
    }
    return null;
  }


  async getSessionByToken(token: string) {
    return await this.connection.manager.findOneById(AuthSession, token, {relations:["user"]});
  }


  use(app: IApplication): void {
    if (this.isEnabled()) {
      for (let adapter of this.adapters) {
        if (adapter.beforeUse) {
          adapter.beforeUse(app);
        }
      }

      if (this.frameworkId === 'express') {
        const session = require('express-session');
        // TODO config session stuff
        app.use(session(this.authConfig.session))
      }

      app.use(passport.initialize());

      for (let adapter of this.adapters) {
        if (adapter.afterUse) {
          adapter.afterUse(app);
        }
      }
      app.use(passport.session());

    }
  }

}
