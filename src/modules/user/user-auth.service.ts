import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {AbstractUserSignup} from "../../libs/models/AbstractUserSignup";
import "rxjs/add/operator/publish";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {AbstractUserLogin} from "../../libs/models/AbstractUserLogin";
import {AbstractUserLogout} from "../../libs/models/AbstractUserLogout";
import {DefaultUserLogout} from "../../libs/models/DefaultUserLogout";
import {Observable} from "rxjs/Observable";
import {IAuthServiceProvider} from "@typexs/ng-base/modules/system/api/auth/IAuthServiceProvider";
import {User} from "../../entities/User";
import {NotYetImplementedError} from "@typexs/base/libs/exceptions/NotYetImplementedError";
import {MessageChannel, MessageService, MessageType} from "@typexs/ng-base";
import {UserAuthMessage} from "./UserAuthMessage";


@Injectable()
export class UserAuthService implements IAuthServiceProvider {

  private _initialized: boolean = false;

  private _config: any = {
    authKey: "txs-auth"
  };

  private channel: MessageChannel<any>;

  private token: string;

  private cacheUser: User;

  private connected: boolean = false;

  private loading: boolean = false;

  constructor(private http: HttpClient, private messageService: MessageService) {
    this.channel = messageService.get('UserAuthService');
  }


  public isInitialized() {
    return this._initialized;
  }


  configure(): Observable<any> {
    let config = this.http.get('/api/user/_config');
    config.subscribe(obj => {
      _.assign(this._config, obj);
      this._initialized = true;
    });
    return config;
  }


  public getTokenKey() {
    return this._config.authKey;
  }


  public getStoredToken(): string {
    let token = localStorage.getItem('token.' + this.getTokenKey());
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
    if(this.cacheUser && this.cacheUser.id == user.id){
      this.cacheUser = user;
    }else{
      this.cacheUser = user;
      let msg = new UserAuthMessage();
      msg.type = MessageType.Success;
      msg.topic = 'set user';
      this.channel.publish(msg);
    }

  }

  resetUser() {
    if(this.cacheUser){
      this.cacheUser = null;
      let msg = new UserAuthMessage();
      msg.type = MessageType.Success;
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
    let req = this.http.get('/api/user');
    return new Promise<User>((resolve, reject) => {
      req.subscribe(
        (user: User) => {
          this.loading = false;
          this.setUser(user);
          resolve(user);
        },
        (error: Error) => {
          console.error(error);
          this.resetUser();
          this.loading = false;
          reject(error);
        }
      );
    });
  }


  isAuthenticated() /*:Observable<boolean>*/ {
    // TODO check if token is expired
    let token = this.getStoredToken();
    const isAuth = this.connected && token != null && token === this.token;
    return isAuth;
  }


  /**
   * startup method to check if an existing token is still active
   */
  initialAuthCheck() {
    return new Promise((resolve, reject) => {
      let token = this.getStoredToken();
      // console.log('auth check ', token)
      if (token) {

        let req = this.http.get('/api/user/isAuthenticated');
        this.connected = false;
        req.subscribe(
          (res: boolean) => {
            this.connected = res;

            if (!res) {
              this.clearStoredToken();
            }else{
              this.getUser()
            }
            resolve();
          },
          (error: Error) => {
            console.error(error);
            this.loading = false;
            this.clearStoredToken();
            this.resetUser();
            resolve();
          }
        );
      } else {
        resolve();
      }
    })
  }


  signup(signup: AbstractUserSignup): Promise<AbstractUserSignup> {
    this.loading = true;
    let signupReq = this.http.post('/api/user/signup', signup);
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
          //signup.addError({property: 'error', value: error.message, error: error});
          signup.resetSecret();
          console.error(error);
          //resolve(signup);
          reject(error);
        }
      );
    });
  }


  authenticate(login: AbstractUserLogin): Promise<AbstractUserLogin> {
    this.loading = true;
    let loginReq = this.http.post('/api/user/login', login);

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

          console.error(error);
          reject(error);
        }
      );
    })
  }


  logout(logout: AbstractUserLogout): Promise<AbstractUserLogout> {
    this.loading = true;
    let req = this.http.get('/api/user/logout');

    return new Promise((resolve, reject) => {
      req.subscribe(
        (user: AbstractUserLogout) => {
          this.loading = false;
          this.clearStoredToken();
          this.resetUser();
          resolve(user);
        },
        (error: Error) => {
          console.error(error);
          this.loading = false;
          this.clearStoredToken();
          this.resetUser();
          reject(error);
        }
      );

    })

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
    return this.isAuthenticated();
  }

  hasPermission(right: string, params?: any): Promise<boolean> | boolean {
    throw new NotYetImplementedError()
  }

  hasPermissionsFor(object: any): Promise<boolean> | boolean {
    throw new NotYetImplementedError()
  }

  //getPermissions()?: Promise<string[]> | string[];

  getRoles(): string[] {
    if (this.cacheUser) {
      return _.map(this.cacheUser.roles, r => r.rolename);
    }
    return [];

  }

  hasRole(role: string):  boolean {
    return !!this.getRoles().find(roles => roles.indexOf(role) !== -1);
  }

  hasRoutePermissions(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> | boolean {
    return true;
  }


}
