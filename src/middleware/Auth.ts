import {
  ClassesLoader,
  Config,
  ConnectionWrapper,
  Container,
  CryptUtils,
  Inject,
  Log,
  RuntimeLoader,
  StorageRef
} from '@typexs/base';
import {Action, IApplication, IMiddleware, IRoutingController, K_ROUTE_CONTROLLER} from '@typexs/server';
import {AuthLifeCycle, K_LIB_AUTH_ADAPTERS} from "../types";
import * as _ from 'lodash';

import {AuthSession} from "../entities/AuthSession";
import {AuthMethod} from "../entities/AuthMethod";
import {EmptyHttpRequestError} from "../libs/exceptions/EmptyHttpRequestError";
import {validate} from "class-validator";
import {BadRequestError} from "routing-controllers";
import {IAuthConfig} from "../libs/auth/IAuthConfig";
import {IAdapterDef} from "../libs/adapter/IAdapterDef";
import {IAuthAdapter} from "../libs/adapter/IAuthAdapter";
import {IAuthOptions} from "../libs/auth/IAuthOptions";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";
import * as bcrypt from "bcrypt";
import {IProcessData} from "../libs/models/IProcessData";
import {IAuthMethodInfo} from "../libs/auth/IAuthMethodInfo";
import {AuthConfigurationFactory} from "../libs/adapter/AuthConfigurationFactory";
import {User} from "../entities/User";
import {EntityController} from "@typexs/schema";


const DEFAULT_CONFIG_OPTIONS: IAuthConfig = {
  httpAuthKey: 'txs-auth',
  allowSignup: true,
  saltRounds: 5,
  userClass: User,

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

  @Inject('EntityController.default')
  private entityController: EntityController;

  @Inject()
  private authConfigFactory: AuthConfigurationFactory;

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


  async prepare(options: any = {}) {
    Container.set("Auth", this);
    let x = Config.get("auth", {});
    this.authConfig = <IAuthConfig>x;
    _.defaults(this.authConfig, DEFAULT_CONFIG_OPTIONS);

    await this.authConfigFactory.initialize();

    let classes = this.loader.getClasses(K_LIB_AUTH_ADAPTERS);

    for (let cls of classes) {
      let authAdapter = <IAuthAdapter>Reflect.construct(cls, []);

      if (!authAdapter.hasRequirements()) {
        Log.error('Can\'t load adapter ' + authAdapter.type + '! Skipping ... ');
        continue;
      }

      if (authAdapter.type) {
        let def: IAdapterDef = {
          className: cls.name,
          filepath: ClassesLoader.getSource(cls),
          moduleName: ClassesLoader.getModulName(cls),
          name: authAdapter.type
        };

        if (!_.isEmpty(this.authConfig) && !_.isEmpty(this.authConfig.methods)) {
          for (let authId in this.authConfig.methods) {
            let methodOptions = this.authConfig.methods[authId];
            methodOptions.authId = authId;
            if (methodOptions.type === authAdapter.type) {
              methodOptions.clazz = cls;

              if (authAdapter.updateOptions) {
                authAdapter.updateOptions(methodOptions);
              }

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

  getConfig() {
    return this.config();
  }


  isEnabled() {
    return this.enabled;
  }


  getHttpAuthKey() {
    return this.authConfig.httpAuthKey.toLocaleLowerCase();
  }


  getRemoteAddress(req: any): string {
    if (_.has(req, 'connection.remoteAddress')) {
      return _.get(req, 'connection.remoteAddress');
    } else {
      return '127.0.0.2';
    }
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

  getSupportedMethodsInfos() {
    let methods: IAuthMethodInfo[] = []

    for (let method of this.getUsedAuthMethods()) {
      let methodInfo: IAuthMethodInfo = {
        label: method.label ? method.label : _.capitalize(method.authId),
        authId: method.authId,
        type: method.type
      }

      if (_.has(method, 'passKeys')) {
        method.passKeys.forEach(k => {
          methodInfo[k] = method[k];
        })
      }

      methods.push(methodInfo);
    }
    return methods;
  }


  config(): IAuthConfig {
    return _.clone(this.authConfig);
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


  getInstanceForLogout(authId: string = 'default', values: any = null): any {
    return this.getInstanceFor("logout", authId, values);
  }


  getInstanceForData(authId: string = 'default', values: any = null): any {
    return this.getInstanceFor("data", authId, values);
  }


  getUserData(user: User, authId: string = 'default') {
    let exchangeObject = this.getInstanceForData(authId, {user: user});
    exchangeObject.success = true;
    return exchangeObject;
  }


  private getAuthIdFromObject(data: AbstractUserLogin | AbstractUserSignup) {
    return _.get(data, "authId", "default");
  }


  private canSignup(adapter: IAuthAdapter) {
    return adapter.canSignup() && _.get(this.authConfig, 'allowSignup', false);
  }


  async doSignup(signup: AbstractUserSignup, req: any, res: any): Promise<IProcessData> {
    // check if data is present
    if (!_.isEmpty(signup)) {

      // check if signup is allowed
      let id = this.getAuthIdFromObject(signup);
      let adapter = this.getAdapterByIdentifier(id);
      signup = this.getInstanceForSignup(id, signup);

      if (!this.canSignup(adapter)) {
        signup.addError({
          property: "username",
          value: "username",
          constraints: {
            signup_not_allowed_error: 'signup not allowed'
          }
        });
        return signup;
      }

      // validate passed data
      signup = this.getInstanceForSignup(id, signup);


      let errors = await validate(signup, {validationError: {target: false}});
      if (_.isEmpty(errors)) {

        // check if username for type is already given
        let adapter = this.getAdapterByIdentifier(id);

        let [method, user] = await Promise.all([
          this.getMethodByUsername(id, signup.getIdentifier()),
          this.getUserByUsername(signup.getIdentifier())
        ]);

        // exist method or user with the given identifier then set error
        if (_.isEmpty(method) && _.isEmpty(user)) {
          // for signup none entry in authuser or authmethod should exists
          // create method first then user

          // TODO impl. adapter method to generate entry
          try {
            let isSignuped = await adapter.signup(signup);
            if (isSignuped) {
              method = await this.createUserAndMethod(adapter, signup);
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


  async createToken(session: AuthSession) {
    return bcrypt.hash(new Date().getTime() + '' + session.ip, 5);
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
  async doLogin(login: AbstractUserLogin, req: any, res: any): Promise<IProcessData> {
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
          loginInstance = await this.doAuthenticatedLogin(loginInstance, req, res);
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

  async doAuthenticatedLogin(loginInstance: AbstractUserLogin, req: any, res: any): Promise<AbstractUserLogin> {
    let adapter = this.getAdapterByIdentifier(loginInstance.authId);

    let method = await this.getMethodByUsername(
      loginInstance.authId,
      loginInstance.getIdentifier()
    );

    let user: User = null;

    if (_.isEmpty(method)) {
      // empty method => no account exists
      if (adapter.canCreateOnLogin()) {
        // create method and user
        user = await this.getUserByUsername(loginInstance.getIdentifier());

        if (_.isEmpty(user)) {
          // user with name does not exists
          try {
            if (adapter.createOnLogin(loginInstance)) {
              method = await this.createUserAndMethod(adapter, loginInstance);
              user = await this.getUser(method.userId);
            } else {
              loginInstance.success = false;
            }
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
            value: loginInstance.getIdentifier(),
            constraints: {
              user_already_exists: "$property already reserved."
            }
          })
        }
      } else {
        // no user found and auto create not allowed
        loginInstance.addError({
          property: 'user',
          value: loginInstance.getIdentifier(),
          constraints: {
            user_not_exists: "$property can not be created for this authentication."
          }
        })
      }
    } else {
      await adapter.extend(method, loginInstance);
      user = await this.getUser(method.userId);
    }

    try {

      let remoteAddress = this.getRemoteAddress(req);
      let current = new Date((new Date()).getTime() - 24 * 60 * 60 * 1000);
      let mgr = this.connection.manager;

      await mgr.transaction(async em => {

        // delete old user sessions which where last updated 24*60*60s
        let q = em.createQueryBuilder(AuthSession, "s").delete();
        q.where("userId = :userId and ip = :ip", {
          userId: user.id,
          ip: remoteAddress
        });
        q.orWhere("userId = :userId and updated_at < :updated_at", {
          userId: user.id,
          updated_at: current
        });
        await q.execute();

        let session = new AuthSession();
        session.ip = remoteAddress;
        session.userId = user.id;
        session.authId = adapter.authId;
        session.token = await this.createToken(session);

        await Promise.all([
          em.save(session),
          em.save(user),
          em.save(method)
        ]);

        loginInstance.token = session.token;
        loginInstance.user = user;
        loginInstance.method = method;
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

    return loginInstance;
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


  async doLogout(user: User, req: any, res: any) {
    let logout = this.getInstanceForLogout();
    const token = this.getToken(req);
    logout.success = false;

    if (!_.isEmpty(token)) {
      let session = await this.getSessionByToken(token);
      if (!_.isEmpty(session) && session.userId === user.id) {
        let repo = this.connection.manager.getRepository(AuthSession);
        let q = repo.createQueryBuilder("s").delete();
        q.where("token = :token", {token: token});
        await q.execute();
        logout.success = true;
        res.removeHeader(this.getHttpAuthKey());
      } else {
        logout.addError({
          property: 'session',
          value: 'session',
          constraints: {
            session_error: "No valid session found."
          }
        })
      }
    } else {
      logout.addError({
        property: 'token',
        value: 'token',
        constraints: {
          token_error: "No auth token in request found."
        }
      })
    }
    return logout;
  }


  getToken(req: any) {
    return req.headers && _.get(req.headers, this.getHttpAuthKey());
  }


  async isAuthenticated(req: any): Promise<boolean> {
    if (this.isEnabled()) {
      const token = this.getToken(req);

      if (!_.isEmpty(token)) {
        let session = await this.getSessionByToken(token);
        if (!_.isEmpty(session)) {
          // TODO check roles
          let user = await this.getUser(session.userId);

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
      return this.getUserByRequest(action.request)
    }
    return null;
  }

  async getUserByRequest(request: any) {
    const token = this.getToken(request);
    let session = await this.getSessionByToken(token);
    if (!_.isEmpty(session)) {
      return this.getUser(session.userId);
    }
    return null;

  }


  getUser(id_or_username: number | string): Promise<User> {
    let cond = {};
    if (_.isString(id_or_username)) {
      cond['username'] = id_or_username;
    } else {
      cond['id'] = id_or_username;
    }
    return this.entityController.find<User>(User, cond, {limit: 1}).then(u => u.shift());
  }


  async getUserByUsername(username: string) {
    return this.getUser(username);
  }


  getMethodByUsername(authId: string, username: string) {
    return this.connection.manager.findOne(AuthMethod, {
      where: {
        identifier: username,
        authId: authId
      }
    });
  }


  getSessionByToken(token: string) {
    return this.connection.manager.findOne(AuthSession, token, {relations: ["user"]});
  }


  createUserAndMethod(adapter: IAuthAdapter, data: AbstractUserSignup | AbstractUserLogin): Promise<AuthMethod> {
    let mgr = this.connection.manager;
    return mgr.transaction(async em => {
      let user = await this.createUser(adapter, data);
      await em.save(user);

      let method = await this.createMethod(adapter, data);
      method.standard = true;
      method.userId = user.id;
      return em.save(method);
    });
  }


  private async createMethod(adapter: IAuthAdapter, signup: AbstractUserSignup | AbstractUserLogin) {
    let method = new AuthMethod();
    method.identifier = signup.getIdentifier();
    method.authId = adapter.authId;
    method.type = adapter.type;

    if (_.has(signup, 'data')) {
      method.data = signup.data;
    }

    await adapter.extend(method, signup);

    if (!method.mail) {
      if (signup instanceof AbstractUserSignup) {
        method.mail = signup.getMail();
      } else if (signup instanceof AbstractUserLogin) {
        // mail could be passed by freestyle data object
        if (_.has(signup, 'data.mail')) {
          method.mail = _.get(signup, 'data.mail');
        }
      }
    }

    if (!method.mail) {
      // TODO create MailError
      throw new Error('no mail was found in data')
    }
    return method;
  }


  private async createUser(adapter: IAuthAdapter, signup: AbstractUserSignup | AbstractUserLogin) {
    let user = new User();
    user.username = signup.getIdentifier();
    await adapter.extend(user, signup);

    if (!user.mail) {
      if (signup instanceof AbstractUserSignup) {
        user.mail = signup.getMail();
      } else if (signup instanceof AbstractUserLogin) {
        // mail could be passed by freestyle data object
        if (_.has(signup, 'data.mail')) {
          user.mail = _.get(signup, 'data.mail');
        }
      }
    }

    if (!user.mail) {
      // TODO create MailError
      throw new Error('no mail was found for the user account')
    }
    return user;
  }


  use(app: IApplication): void {
    if (this.isEnabled()) {
      if (this.frameworkId === 'express') {
        const session = require('express-session');
        // TODO config session stuff
        app.use(session(this.authConfig.session));

        for (let adapter of this.adapters) {
          if (adapter.use) {
            adapter.use(app, 'after');
          }
        }
      }
    }
  }

}
