import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {AbstractUserSignup} from '../../libs/models/AbstractUserSignup';
import 'rxjs/add/operator/publish';
import {DefaultUserLogin} from '../../libs/models/DefaultUserLogin';
import {DefaultUserSignup} from '../../libs/models/DefaultUserSignup';
import {AbstractUserLogin} from '../../libs/models/AbstractUserLogin';
import {AbstractUserLogout} from '../../libs/models/AbstractUserLogout';
import {DefaultUserLogout} from '../../libs/models/DefaultUserLogout';
import {Observable} from 'rxjs/Observable';
import {IAuthServiceProvider} from '@typexs/ng-base/modules/system/api/auth/IAuthServiceProvider';
import {User} from '../../entities/User';
import {NotYetImplementedError} from 'commons-base/browser';
import {AuthMessage, LogMessage, MessageChannel, MessageService, MessageType} from '@typexs/ng-base';
import {BehaviorSubject} from 'rxjs';
import {IAuthSettings} from '../../libs/auth/IAuthSettings';
import {_API_USER_IS_AUTHENTICATED, _API_USER_LOGIN, _API_USER_LOGOUT, _API_USER_SIGNUP, API_USER} from '../../libs/Constants';

@Injectable()
export class UserAuthService implements IAuthServiceProvider {

  private _configured: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _config: IAuthSettings = {
    authKey: 'txs-auth',
    enabled: false,
    methods: []
  };

  private channel: MessageChannel<AuthMessage>;

  private logChannel: MessageChannel<LogMessage>;

  private token: string;

  private cacheUser: User;

  private connected = false;

  private loading = false;

  constructor(private http: HttpClient, private messageService: MessageService) {
    this.logChannel = this.messageService.getLogService();
  }

  getChannel(): MessageChannel<AuthMessage> {
    if (!this.channel) {
      this.channel = <MessageChannel<AuthMessage>>this.messageService.get('AuthService');
    }
    return this.channel;
  }


  public isInitialized() {
    if (this._initialized.value) {
      return this._initialized.getValue();
    }
    return this._initialized.asObservable();
  }


  configure(): Observable<any> {
    const config = this.http.get('/api/user/_config');
    config.subscribe(obj => {
      _.assign(this._config, obj);
      this._configured.next(true);
      this._configured.complete();
    });
    return config;
  }


  public getTokenKey() {
    return _.get(this._config, 'authKey', null);
  }


  public getStoredToken(): string {
    const token = localStorage.getItem('token.' + this.getTokenKey());
    return _.isUndefined(token) ? null : token;
  }

  saveStoredToken(token: string) {
    localStorage.setItem('token.' + this.getTokenKey(), token);
    this.setToken(token);
  }

  clearStoredToken() {
    this.connected = false;
    this.resetUser();
    localStorage.removeItem('token.' + this.getTokenKey());
  }


  setUser(user: User) {
    if (this.cacheUser && this.cacheUser.id === user.id) {
      this.cacheUser = user;
    } else {
      this.cacheUser = user;
      const msg = new AuthMessage();
      msg.type = MessageType.SUCCESS;
      msg.topic = 'set user';
      this.channel.publish(msg);
    }

  }

  resetUser() {
    if (this.cacheUser) {
      this.cacheUser = null;
      const msg = new AuthMessage();
      msg.type = MessageType.SUCCESS;
      msg.topic = 'unset user';
      this.channel.publish(msg);
    }
  }

  /**
   * Method for interceptor to set the request token
   */
  public setToken(token: string): void {
    this.token = token;
  }


  getUser(): Promise<User> | User {
    if (this.cacheUser) {
      return this.cacheUser;
    }
    this.loading = true;
    const req = this.http.get('/api' + API_USER);
    return new Promise<User>((resolve, reject) => {
      req.subscribe(
        (user: User) => {
          this.loading = false;
          this.setUser(user);
          resolve(user);
        },
        (error: Error) => {
          console.error('getUser: ' + error.message);
          this.resetUser();
          this.loading = false;
          reject(error);
        }
      );
    });
  }


  isAuthenticated() /*:Observable<boolean>*/ {
    // TODO check if token is expired
    const token = this.getStoredToken();
    const isAuth = this.connected && token != null && token === this.token;
    return isAuth;
  }

  isEnabled() {
    return _.get(this._config, 'enabled', false);
  }

  /**
   * startup method to check if an existing token is still active
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this.isEnabled()) {
        const token = this.getStoredToken();
        // console.log('auth check ', token)
        if (token) {

          const req = this.http.get('/api' + API_USER + _API_USER_IS_AUTHENTICATED);
          this.connected = false;
          req.subscribe(
            (res: boolean) => {
              this.connected = res;

              if (!res) {
                this.clearStoredToken();
              } else {
                this.getUser();
              }
              resolve();
            },
            (error: Error) => {
              this.logChannel.publish(LogMessage.error(error, this, 'init'));
              this.loading = false;
              this.clearStoredToken();
              this.resetUser();
              resolve();
            }
          );
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    }).then(() => {
      this._initialized.next(true);
      this._initialized.complete();
    }).catch(() => {
      this._initialized.next(true);
      this._initialized.complete();
    });

  }


  signup(signup: AbstractUserSignup): Promise<AbstractUserSignup> {
    this.loading = true;
    const signupReq = this.http.post('/api' + API_USER + _API_USER_SIGNUP, signup);
    return new Promise((resolve, reject) => {
      signupReq.subscribe(
        (user: AbstractUserSignup) => {
          this.loading = false;
          // console.log(user);
          this.connected = false;
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          this.connected = false;
          // signup.addError({property: 'error', value: error.message, error: error});
          signup.resetSecret();
          // resolve(signup);
          reject(error);
        }
      );
    });
  }


  authenticate(login: AbstractUserLogin): Promise<AbstractUserLogin> {
    this.loading = true;
    const loginReq = this.http.post('/api' + API_USER + _API_USER_LOGIN, login);

    return new Promise((resolve, reject) => {
      loginReq.subscribe(
        (user: AbstractUserLogin) => {
          this.loading = false;
          this.connected = true;
          this.saveStoredToken(user.$state.token);
          this.setUser(user.$state.user);
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          this.connected = false;
          // login.addError({property: 'error', value: error.message, error: error});
          login.resetSecret();
          this.clearStoredToken();
          reject(error);
        }
      );
    });
  }



  logout(logout: AbstractUserLogout): Promise<AbstractUserLogout> {
    this.loading = true;
    const req = this.http.get('/api' + API_USER + _API_USER_LOGOUT);

    return new Promise((resolve, reject) => {
      req.subscribe(
        (user: AbstractUserLogout) => {
          this.loading = false;
          this.clearStoredToken();
          this.resetUser();
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          this.clearStoredToken();
          this.resetUser();
          reject(error);
        }
      );

    });

  }


  /**
   * Method for getting the suitable user login model, depending of used adapter
   *
   * TODO Impl. support mulitple adapter
   *
   */
  newUserLogin(): DefaultUserLogin {
    return new DefaultUserLogin();
  }

  /**
   * Method for getting the suitable user login model, depending of used adapter
   *
   * TODO Impl. support mulitple adapter
   *
   */
  newUserSignup(): DefaultUserSignup {
    return new DefaultUserSignup();
  }

  newUserLogout(): DefaultUserLogout {
    return new DefaultUserLogout();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated() || !this.isEnabled();
  }

  hasPermission(right: string, params?: any): Promise<boolean> | boolean {
    throw new NotYetImplementedError();
  }

  hasPermissionsFor(object: any): Promise<boolean> | boolean {
    throw new NotYetImplementedError();
  }


  getRoles(): string[] {
    if (this.cacheUser) {
      return _.map(this.cacheUser.roles, r => r.rolename);
    }
    return [];
  }


  hasRole(role: string): boolean {
    if (this.isEnabled()) {
      return !!this.getRoles().find(roles => roles.indexOf(role) !== -1);
    } else {
      return true;
    }
  }


  hasRoutePermissions(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> | boolean {
    return true;
  }


}
