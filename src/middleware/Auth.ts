import {
  Config, Inject, RuntimeLoader, ClassesLoader, StorageRef, Container, CryptUtils,
  ConnectionWrapper, Log
} from 'typexs-base';
import {Action, IApplication, IMiddleware, IRoutingController, K_ROUTE_CONTROLLER} from 'typexs-server';
import {AuthLifeCycle, K_LIB_AUTH_ADAPTERS} from "../types";
import * as _ from 'lodash';
import {
  EntityManager
} from "typeorm";
import {AuthUser} from "../entities/AuthUser";
import {AuthSession} from "../entities/AuthSession";
import {AuthMethod} from "../entities/AuthMethod";
import {EmptyHttpRequestError} from "../libs/exceptions/EmptyHttpRequestError";
import {validate} from "class-validator";
import * as bcrypt from "bcrypt";
import {BadRequestError} from "routing-controllers";
import {log} from "util";
import {IAuthConfig} from "../libs/auth/IAuthConfig";
import {IAdapterDef} from "../libs/adapter/IAdapterDef";
import {IAuthAdapter} from "../libs/adapter/IAuthAdapter";
import {IAuthOptions} from "../libs/auth/IAuthOptions";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";
import {IAuthData} from "../libs/adapter/IAuthData";


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
          for (let authId in this.authConfig.methods) {
            let methodOptions = this.authConfig.methods[authId];
            methodOptions.authId = authId;
            if (methodOptions.type === obj.type) {
              methodOptions.clazz = cls;
              let adapterInstance = <IAuthAdapter>Container.get(cls);
              adapterInstance.authId = authId;
              this.adapters.push(adapterInstance);
              await adapterInstance.prepare(methodOptions);
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


  getAdapterByIdentifier(authId: string): IAuthAdapter {
    return _.find(this.getAdapters(), a => a.authId === authId);
  }


  extendOptions(options: any) {
    if (options.type === K_ROUTE_CONTROLLER) {
      (<IRoutingController>options).authorizationChecker = this.authorizationChecker.bind(this);
      (<IRoutingController>options).currentUserChecker = this.currentUserChecker.bind(this);
    }
  }


  private getInstanceFor(stage: AuthLifeCycle, authId: string = 'default', values: any = null): any {
    let adapter = this.getAdapterByIdentifier(authId);
    if (adapter && adapter.getModelFor(stage)) {
      let clazz = adapter.getModelFor(stage);
      let signup = Reflect.construct(clazz, []);
      if (values) {
        _.assign(signup, values);
      }
      signup.authId = authId;
      return signup;
    }
    return null;
  }


  getInstanceForSignup(authId: string = 'default', values: any = null): any {
    return this.getInstanceFor("signup", authId, values);
  }


  getInstanceForLogin(authId: string = 'default', values: any = null): any {
    return this.getInstanceFor("login", authId, values);
  }


  private getAuthIdFromObject(data: AbstractUserLogin | AbstractUserSignup) {
    return _.get(data, "authId", "default");
  }


  async doSignup(signup: AbstractUserSignup, req: any, res: any) {
    if (!_.isEmpty(signup)) {
      let id = this.getAuthIdFromObject(signup);
      let adapter = this.getAdapterByIdentifier(id);

      if (!adapter.canSignup()) {
        signup.addError({
          property: "username",
          value: "username",
          constraints: {
            signup_not_allowed_error: 'signup not allowed'
          }
        });
        return signup;
      }

      signup = this.getInstanceForSignup(id, signup);
      let errors = await validate(signup, {validationError: {target: false}});
      if (_.isEmpty(errors)) {
        // everything is okay
        // check if username for type is already given
        let adapter = this.getAdapterByIdentifier(id);

        let signupData = adapter.extractAccessData(signup);
        let [method, user] = await Promise.all([
          this.getMethodByUsername(id, signupData.identifier),
          this.getUserByUsername(signupData.identifier)
        ]);


        if (_.isEmpty(method) && _.isEmpty(user)) {
          // for signup none entry in authuser or authmethod should exists
          // create method first then user
          // TODO impl. adapter method to generate entry
          try {
            let isSignuped = await adapter.signup(signup);

            if (isSignuped) {
              method = await this.createUserAndMethod(adapter, signupData);
              signup.success = isSignuped;
            } else {
              // TODO
            }


          } catch (err) {
            // TODO
            Log.error(err);
            throw new BadRequestError(err.message);
          }

          // TODO: auto sign in
          // TODO: verify mail
          signup.resetSecret();
          return signup;

        } else {
          signup.resetSecret();
          signup.addError({
            property: "username", // Object's property that haven't pass validation.
            value: "username", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "$property already assigned."
            }
          });
          return signup;
        }

      } else {
        signup.resetSecret();
        signup.errors = errors;
        return signup;
      }
    } else {
      throw new EmptyHttpRequestError();
    }
  }


  /**
   *
   * TODO impl. possibility to create account on first positiv login, like ldap
   *
   * @param {AbstractUserLogin} login
   * @param req
   * @param res
   * @returns {Promise<AbstractUserLogin>}
   */
  async doLogin(login: AbstractUserLogin, req: any, res: any) {
    // if logged in
    // passport.authenticate()
    let isAuthenticated = await this.isAuthenticated(req);
    if (isAuthenticated) {
      login.isAuthenticated = isAuthenticated;
      login.resetSecret();
      return login;
    } else {
      if (!_.isEmpty(login)) {
        let authIdsChain = this.authChain();
        let loginInstance: AbstractUserLogin = null;
        for (let authId of authIdsChain) {
          loginInstance = await this.doLoginForAdapter(authId, login);
          if (loginInstance.isAuthenticated) {
            break;
          }
        }

        if (loginInstance && loginInstance.isAuthenticated) {
          let mgr = this.connection.manager;
          let adapter = this.getAdapterByIdentifier(loginInstance.authId);

          let accessData = adapter.extractAccessData(loginInstance);
          let method = await this.getMethodByUsername(loginInstance.authId, accessData.identifier);
          let user: AuthUser = null;
          if (_.isEmpty(method)) {
            // empty method => no account exists
            if (adapter.canCreateOnLogin()) {
              // create method and user
              user = await this.getUserByUsername(accessData.identifier);

              if (_.isEmpty(user)) {
                // user with name does not exists
                try {
                  method = await this.createUserAndMethod(adapter, accessData);
                  user = method.user;
                } catch (err) {
                  Log.error(err);
                  loginInstance.addError({
                    property: 'user',
                    value: err.message,
                    constraints: {
                      user_create_error: "$property error thrown $value."
                    }
                  })
                }
              } else {
                // username already used
                loginInstance.addError({
                  property: 'username',
                  value: accessData.identifier,
                  constraints: {
                    user_already_exists: "$property already reserved."
                  }
                })
              }

            } else {
              // no user found and auto create not allowed
              loginInstance.addError({
                property: 'user',
                value: accessData.identifier,
                constraints: {
                  user_not_exists: "$property can not be created for this authentication."
                }
              })

            }
          } else {
            user = method.user;
          }

          try {
            await mgr.transaction(async em => {

              let q = em.createQueryBuilder(AuthSession, "s").delete().where("userId = :userId",
                {userId: user.id}
              );
              await q.execute();

              let session = new AuthSession();
              session.ip = req.connection.remoteAddress;
              session.user = user;
              session.authId = adapter.authId;
              session.token = CryptUtils.shorthash(new Date().getTime() + '' + session.ip);
              await Promise.all([em.save(session), em.save(user), em.save(method)]);
              loginInstance.user = user;
              loginInstance.success = true;
              res.setHeader(this.getHttpAuthKey(), session.token);
            });

          } catch (err) {
            Log.error(err);
            loginInstance.addError({
              property: 'user',
              value: err.message,
              constraints: {
                session_error: "$property can not be created for this authentication."
              }
            })
          }
        }


        return loginInstance;
      } else {
        login.addError({
          property: 'username',
          value: null,
          constraints: {
            empty_request_error: "$property empty, no access data passed."
          }
        })
        return login;
      }

    }
  }


  private authChain(): string[] {
    if (this.authConfig.chain && !_.isEmpty(this.authConfig.chain)) {
      return this.authConfig.chain;
    } else {
      let first = _.first(this.getAdapters());
      return [first.authId];
    }
  }


  private async doLoginForAdapter(authId: string, _login: AbstractUserLogin): Promise<AbstractUserLogin> {

    let login = this.getInstanceForLogin(authId, _login);
    let errors = await validate(login, {validationError: {target: false}});

    login.isAuthenticated = false;

    if (_.isEmpty(errors)) {
      // everything is okay
      // check if username for type is already given
      let adapter = this.getAdapterByIdentifier(authId);
      login.isAuthenticated = await adapter.authenticate(login);
    } else {
      login.errors = errors;
    }

    login.resetSecret();
    return login;

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


  getUserByUsername(username: string) {
    return this.connection.manager.findOne(AuthUser, {
      where: {
        username: username
      }
    });
  }


  getMethodByUsername(authId: string, username: string) {
    return this.connection.manager.findOne(AuthMethod, {
      relations: ["user"],
      where: {
        identifier: username,
        authId: authId
      }
    });
  }


  getSessionByToken(token: string) {
    return this.connection.manager.findOneById(AuthSession, token, {relations: ["user"]});
  }


  createUserAndMethod(adapter: IAuthAdapter, signupData: IAuthData): Promise<AuthMethod> {
    let mgr = this.connection.manager;
    return mgr.transaction(async em => {
      let method = await this.createMethod(em, adapter, signupData);
      method.user = await this.createUser(em, method, adapter, signupData);
      return await mgr.save(method);
    });
  }


  private async createMethod(em: EntityManager, adapter: IAuthAdapter, signupData: IAuthData) {
    let method = new AuthMethod();
    method.identifier = signupData.identifier;
    method.authId = adapter.authId;
    method.secret = signupData.secret ? await bcrypt.hash(signupData.secret, this.authConfig.saltRounds) : null;
    method.type = adapter.type;
    method.mail = signupData.mail;
    if (signupData.data) {
      method.data = signupData.data;
    }
    return await em.save(method);
  }


  private async createUser(em: EntityManager, method: AuthMethod, adapter: IAuthAdapter, signupData: IAuthData) {
    let user = new AuthUser();
    user.username = signupData.identifier;
    user.mail = signupData.mail;
    user.preferedMethod = method;
    return await em.save(user);
  }


  use(app: IApplication): void {
    if (this.isEnabled()) {
      /*
      for (let adapter of this.adapters) {
        if (adapter.beforeUse) {
          adapter.beforeUse(app);
        }
      }
      */

      if (this.frameworkId === 'express') {
        const session = require('express-session');
        // TODO config session stuff
        app.use(session(this.authConfig.session))
      }
      /*
            app.use(passport.initialize());

            for (let adapter of this.adapters) {
              if (adapter.afterUse) {
                adapter.afterUse(app);
              }
            }
            app.use(passport.session());
      */
    }
  }

}
