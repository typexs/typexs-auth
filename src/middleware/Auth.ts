import * as _ from 'lodash';
import * as bcrypt from "bcrypt";

import {ConnectionWrapper, Container, Inject, Log, StorageRef} from '@typexs/base';
import {Action, IApplication, IMiddleware, IRoutingController, K_ROUTE_CONTROLLER} from '@typexs/server';
import {AuthLifeCycle} from "../types";

import {AuthSession} from "../entities/AuthSession";
import {AuthMethod} from "../entities/AuthMethod";
import {EmptyHttpRequestError} from "../libs/exceptions/EmptyHttpRequestError";
import {BadRequestError} from "routing-controllers";
import {IAuthConfig} from "../libs/auth/IAuthConfig";
import {IAuthAdapter} from "../libs/adapter/IAuthAdapter";
import {IAuthOptions} from "../libs/auth/IAuthOptions";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";
import {IAuthMethodInfo} from "../libs/auth/IAuthMethodInfo";

import {User} from "../entities/User";
import {EntityController} from "@typexs/schema";
import {AbstractUserLogout} from "../libs/models/AbstractUserLogout";
import {AuthDataContainer} from "../libs/auth/AuthDataContainer";
import {AuthHelper} from "../libs/auth/AuthHelper";
import {AuthManager} from "../libs/auth/AuthManager";

export class Auth implements IMiddleware {


  @Inject('storage.default')
  private storage: StorageRef;

  @Inject('EntityController.default')
  private entityController: EntityController;

  @Inject(AuthManager.NAME)
  private authManager: AuthManager;


  private connection: ConnectionWrapper;

  private frameworkId: string;


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


    if (this.isEnabled()) {
      this.connection = await this.storage.connect();

    }
  }

  getManager() {
    return this.authManager;
  }

  private getAuthConfig() {
    return this.authManager.getConfig();
  }

  getConfig() {
    return this.config();
  }


  isEnabled() {
    return this.authManager.isEnabled();
  }


  getHttpAuthKey() {
    return this.getAuthConfig().httpAuthKey.toLocaleLowerCase();
  }


  getRemoteAddress(req: any): string {
    if (_.has(req, 'connection.remoteAddress')) {
      return _.get(req, 'connection.remoteAddress');
    } else {
      return '127.0.0.2';
    }
  }

  /*
    getDefinedAdapters(): IAdapterDef[] {
      return this.allAdapters;
    }
  */

  getUsedAuthMethods(): IAuthOptions[] {
    if (!_.isEmpty(this.getAuthConfig())) {
      return _.values(this.getAuthConfig().methods);
    }
    return [];
  }


  getAdapters(): IAuthAdapter[] {
    return this.authManager.getAdapters();
  }


  getAdapterByIdentifier(authId: string): IAuthAdapter {
    return this.authManager.getAdapter(authId);
  }


  extendOptions(options: any) {
    if (options.type === K_ROUTE_CONTROLLER) {
      (<IRoutingController>options).authorizationChecker = this.authorizationChecker.bind(this);
      (<IRoutingController>options).currentUserChecker = this.currentUserChecker.bind(this);
    }
  }

  getSupportedMethodsInfos() {
    let methods: IAuthMethodInfo[] = [];

    for (let method of this.getUsedAuthMethods()) {
      let methodInfo: IAuthMethodInfo = {
        label: method.label ? method.label : _.capitalize(method.authId),
        authId: method.authId,
        type: method.type
      };

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
    return _.clone(this.getAuthConfig());
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


  getInstanceForSignup<T extends AbstractUserSignup>(authId: string = 'default', values: any = null): T {
    return this.getInstanceFor("signup", authId, values);
  }


  getInstanceForLogin<T extends AbstractUserLogin>(authId: string = 'default', values: any = null): T {
    return this.getInstanceFor("login", authId, values);
  }


  getInstanceForLogout<T extends AbstractUserLogout>(authId: string = 'default', values: any = null): T {
    return this.getInstanceFor("logout", authId, values);
  }

  /*
    getInstanceForData(authId: string = 'default', values: any = null): any {
      return this.getInstanceFor("data", authId, values);
    }


    getUserData(user: User, authId: string = 'default') {
      let exchangeObject = this.getInstanceForData(authId, {user: user});
      exchangeObject.success = true;
      return exchangeObject;
    }
  */

  private getAuthIdFromObject(data: AbstractUserLogin | AbstractUserSignup) {
    return _.get(data, "authId", "default");
  }


  private canSignup(adapter: IAuthAdapter) {
    return adapter.canSignup() && _.get(this.getAuthConfig(), 'allowSignup', false);
  }


  async doSignup<T extends AbstractUserSignup>(signup: T, req: any, res: any): Promise<AuthDataContainer<T>> {
    // check if data is present
    let dataContainer: AuthDataContainer<any> = null;
    if (!_.isEmpty(signup)) {

      // check if signup is allowed
      let id = this.getAuthIdFromObject(signup);
      let adapter = this.getAdapterByIdentifier(id);
      signup = this.getInstanceForSignup(id, signup);
      dataContainer = new AuthDataContainer(signup);

      if (!this.canSignup(adapter)) {
        dataContainer.addError({
          property: "username",
          value: "username",
          constraints: {
            signup_not_allowed_error: 'signup not allowed'
          }
        });
        return dataContainer;
      }

      // validate passed data
//      signup = this.getInstanceForSignup(id, signup);
//      let validator = new DataContainer(signup);
      await dataContainer.validate();


      // let errors = await validate(signup, {validationError: {target: false}});
      if (dataContainer.isSuccessValidated) {

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
            let isSignuped = await adapter.signup(dataContainer);
            if (isSignuped) {
              await AuthHelper.createUserAndMethod(
                this.entityController,
                adapter,
                dataContainer
              );
              dataContainer.success = isSignuped;
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
          return dataContainer;

        } else {
          signup.resetSecret();
          dataContainer.addError({
            property: "username", // Object's property that haven't pass validation.
            value: "username", // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: "$property already assigned."
            }
          });
          return dataContainer;
        }

      } else {
        signup.resetSecret();
        return dataContainer;
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
  async doLogin(login: AbstractUserLogin, req: any, res: any): Promise<AuthDataContainer<AbstractUserLogin>> {
    let id = this.getAuthIdFromObject(login);
    login = this.getInstanceForLogin(id, login);
    let container: AuthDataContainer<AbstractUserLogin> = new AuthDataContainer<AbstractUserLogin>(login);
    let isAuthenticated = await this.isAuthenticated(req);
    if (isAuthenticated) {
      container.isAuthenticated = isAuthenticated;
      login.resetSecret();
      return container;
    } else {

      if (!_.isEmpty(login)) {
        let authIdsChain = this.authChain();

        for (let authId of authIdsChain) {
          container = await this.doLoginForAdapter(authId, login);
          if (container.isAuthenticated) {
            break;
          }
        }

        if (container && container.isAuthenticated) {
          container = await this.doAuthenticatedLogin(container, req, res);
        }

        return container;

      } else {
        container.addError({
          property: 'username',
          value: null,
          constraints: {
            empty_request_error: "$property empty, no access data passed."
          }
        });
        return container;
      }
    }
  }


  async doAuthenticatedLogin(dataContainer: AuthDataContainer<AbstractUserLogin>, req: any, res: any): Promise<AuthDataContainer<AbstractUserLogin>> {
    let loginInstance = dataContainer.instance;
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
            if (adapter.createOnLogin(dataContainer)) {
              let ref = await AuthHelper.createUserAndMethod(
                this.entityController,
                adapter,
                dataContainer
              );
              user = ref.user;
              method = ref.method;
              // user = await this.getUser(method.userId);
            } else {
              dataContainer.success = false;
            }
          } catch (err) {
            Log.error(err);
            dataContainer.addError({
              property: 'user',
              value: err.message,
              constraints: {
                user_create_error: "$property error thrown $value."
              }
            })
          }
        } else {
          // username already used
          dataContainer.addError({
            property: 'username',
            value: loginInstance.getIdentifier(),
            constraints: {
              user_already_exists: "$property already reserved."
            }
          })
        }
      } else {
        // no user found and auto create not allowed
        dataContainer.addError({
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

        dataContainer.token = session.token;
        dataContainer.user = user;
        dataContainer.method = method;
        dataContainer.success = true;
        res.setHeader(this.getHttpAuthKey(), session.token);
      });

    } catch (err) {
      Log.error(err);
      dataContainer.addError({
        property: 'user',
        value: err.message,
        constraints: {
          session_error: "$property can not be created for this authentication."
        }
      })
    }

    return dataContainer;
  }


  private authChain(): string[] {
    if (this.getAuthConfig().chain && !_.isEmpty(this.getAuthConfig().chain)) {
      return this.getAuthConfig().chain;
    } else {
      let first = _.first(this.getAdapters());
      return [first.authId];
    }
  }


  private async doLoginForAdapter(authId: string, _login: AbstractUserLogin): Promise<AuthDataContainer<AbstractUserLogin>> {

    let login = this.getInstanceForLogin(authId, _login);
    let dataContainer = new AuthDataContainer(login);
    await dataContainer.validate();
    dataContainer.isAuthenticated = false;

    if (dataContainer.isSuccessValidated) {
      // everything is okay
      // check if username for type is already given
      let adapter = this.getAdapterByIdentifier(authId);
      dataContainer.isAuthenticated = await adapter.authenticate(dataContainer);
    }

    login.resetSecret();
    return dataContainer;

  }


  async doLogout(user: User, req: any, res: any): Promise<AuthDataContainer<User>> {
    let container = new AuthDataContainer(user);
    const token = this.getToken(req);
    container.success = false;

    if (!_.isEmpty(token)) {
      let session = await this.getSessionByToken(token);
      if (!_.isEmpty(session) && session.userId === user.id) {
        let repo = this.connection.manager.getRepository(AuthSession);
        let q = repo.createQueryBuilder("s").delete();
        q.where("token = :token", {token: token});
        await q.execute();
        container.success = true;
        res.removeHeader(this.getHttpAuthKey());
      } else {
        container.addError({
          property: 'session',
          value: 'session',
          constraints: {
            session_error: "No valid session found."
          }
        })
      }
    } else {
      container.addError({
        property: 'token',
        value: 'token',
        constraints: {
          token_error: "No auth token in request found."
        }
      })
    }
    return container;
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


  async authorizationChecker(action: Action, roles: any[]): Promise<boolean> {
    return this.isAuthenticated(action.request);
  }


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
    return this.connection.manager.findOne(AuthSession, token);
  }


  use(app: IApplication): void {
    if (this.isEnabled()) {
      if (this.frameworkId === 'express') {
        const session = require('express-session');
        // TODO config session stuff
        app.use(session(this.getAuthConfig().session));

        for (let adapter of this.authManager.getAdapters()) {
          if (adapter.use) {
            adapter.use(app, 'after');
          }
        }
      }
    }
  }

}
