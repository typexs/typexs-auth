import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AbstractUserSignup} from '../../libs/models/AbstractUserSignup';
import {DefaultUserLogin} from '../../libs/models/DefaultUserLogin';
import {DefaultUserSignup} from '../../libs/models/DefaultUserSignup';
import {AbstractUserLogin} from '../../libs/models/AbstractUserLogin';
import {AbstractUserLogout} from '../../libs/models/AbstractUserLogout';
import {DefaultUserLogout} from '../../libs/models/DefaultUserLogout';
import {Observable} from 'rxjs/Observable';
import {IAuthServiceProvider} from '@typexs/ng-base/modules/base/api/auth/IAuthServiceProvider';
import {User} from '../../entities/User';
import {AuthMessage, BackendClientService, LogMessage, MessageChannel, MessageService, MessageType} from '@typexs/ng-base';
import {BehaviorSubject, of, Subject} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {IAuthSettings} from '../../libs/auth/IAuthSettings';
import {API_USER, API_USER_CONFIG, API_USER_IS_AUTHENTICATED, API_USER_LOGIN, API_USER_LOGOUT, API_USER_SIGNUP} from '../../libs/Constants';
import {ISecuredResource, PermissionHelper} from '@typexs/roles-api/index';
import {UserAuthHelper} from './lib/UserAuthHelper';


function parseUser(user: any) {
  if (user instanceof User) {
    return user;
  }
  const _user = new User();
  _.assign(_user, user);
  return _user;
}

/**
 * UserAuthService implements the interface of IAuthServiceProvider
 */
@Injectable()
export class UserAuthService implements IAuthServiceProvider {

  private _configured$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _initialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // private _user$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

  private authCheckLoading = false;

  private permissions: string[];

  constructor(private backendClientService: BackendClientService,
              private messageService: MessageService) {
    this.logChannel = this.messageService.getLogService();
  }

  getChannel(): MessageChannel<AuthMessage> {
    if (!this.channel) {
      this.channel = <MessageChannel<AuthMessage>>this.messageService.get('AuthService');
    }
    return this.channel;
  }


  public isInitialized(): Observable<boolean> {
    return this._initialized$;
  }


  startup() {
    return this.configure().pipe(mergeMap(x => this.init()));
  }


  configure(): Observable<any> {
    const config = this.backendClientService.callApi(API_USER_CONFIG);
    config.subscribe(obj => {
      _.assign(this._config, obj);
      this._configured$.next(true);
    }, error => {
      this._configured$.error(error);
    });
    return this._configured$;
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
    const _user = parseUser(user);
    if (this.cacheUser && this.cacheUser.id === user.id) {
      this.cacheUser = _user;
    } else {
      this.cacheUser = _user;
      const msg = new AuthMessage();
      msg.type = MessageType.SUCCESS;
      msg.topic = 'set user';
      this.channel.publish(msg);
    }
    return this.cacheUser;

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

  /**
   * Returns the user object
   */
  getUser(reload: boolean = false): Observable<User> {
    const subject = new Subject<User>();
    if (this.cacheUser && !reload) {
      // Tick out
      setTimeout(() => {
        subject.next(this.cacheUser);
        subject.complete();
      }, 0);
    } else {
      this.loading = true;
      this.backendClientService.callApi<User>(API_USER).subscribe(x => {
          this.setUser(x);
          this.loading = true;
          subject.next(this.cacheUser);
        }, error => {
          this.loading = true;
          subject.next(null);
        },
        () => {
          this.loading = false;
          subject.complete();
        });
    }
    return subject;
  }


  // isAuthenticated(): Observable<boolean> {
  //   // TODO check if token is expired
  //   const token = this.getStoredToken();
  //   const isAuth = this.connected && token != null && token === this.token;
  //   return this._isAuthenticated$;
  // }

  isAuthenticated() {
    // console.log('isAuthenticated ' + this.authCheckLoading);
    const token = this.getStoredToken();
    const validToken = token != null && token === this.token;
    if (token && (!validToken || !this.connected) && !this.authCheckLoading) {
      this.checkAuthentication();
    }
    return this._isAuthenticated$;
  }


  private checkAuthentication() {
    this.connected = false;
    this.authCheckLoading = true;
    this.backendClientService.callApi<boolean>(API_USER_IS_AUTHENTICATED)
      .subscribe(
        value => {
          this.connected = value;
          this._isAuthenticated$.next(value);
          if (!value) {
            this.clearStoredToken();
          } else {
            this.getUser();
          }
        },
        error => {
          // this.logChannel.publish(LogMessage.error(error, this, 'init'));
          this.clearStoredToken();
          this.resetUser();
          this._isAuthenticated$.error(error);
        },
        () => {
          this.authCheckLoading = false;
        }
      );
    return this._isAuthenticated$;
  }

  isEnabled(): boolean {
    // return _.get(this._config, 'enabled', false);
    return true;
  }

  /**
   * startup method to check if an existing token is still active
   */
  init() {
    if (this.isEnabled()) {
      this.checkAuthentication().subscribe(x => {
        this._initialized$.next(true);
      }, error => {
        this._initialized$.error(error);
      });
    } else {
      this._initialized$.next(true);
    }
    return this._initialized$;
  }


  signup(signup: AbstractUserSignup): Observable<AbstractUserSignup> {
    this.loading = true;
    const subject = new Subject<AbstractUserSignup>();
    this.backendClientService.callApi(API_USER_SIGNUP, {content: signup})
      .subscribe(
        (value: AbstractUserSignup) => {
          subject.next(value);
        },
        error => {
          signup.resetSecret();
          subject.error(error);
        },
        () => {
          this.loading = false;
          this.connected = false;
        }
      );
    return subject;
  }


  authenticate(login: AbstractUserLogin): Observable<AbstractUserLogin> {
    this.loading = true;
    const subject = new Subject<AbstractUserLogin>();
    this.backendClientService.callApi(API_USER_LOGIN, {content: login})
      .subscribe(
        (user: AbstractUserLogin) => {
          this.loading = false;
          this.connected = true;
          this.saveStoredToken(user.$state.token);
          this.setUser(user.$state.user);
          subject.next(user);
        },
        error => {
          // login.addError({property: 'error', value: error.message, error: error});
          login.resetSecret();
          this.clearStoredToken();
          subject.error(error);
        },
        () => {
          this.loading = false;
          this.connected = false;
          subject.complete();
        }
      );
    return subject;


  }


  logout(logout: AbstractUserLogout): Observable<AbstractUserLogout> {
    this.loading = true;
    const subject = new Subject<AbstractUserLogout>();
    this.backendClientService.callApi(API_USER_LOGOUT).subscribe(
      (user: AbstractUserLogout) => {
        this.loading = false;
        this.clearStoredToken();
        this.resetUser();
        subject.next(user);
      },
      error => {
        this.loading = false;
        this.clearStoredToken();
        this.resetUser();
        subject.error(error);
      },
      () => {
        subject.complete();
      }
    );

    return subject;
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

  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated();
  }


  getPermissions(reload: boolean = false): Observable<string[]> {
    if (_.isUndefined(this.permissions) || reload) {
      const subject = new Subject<string[]>();
      this.getUser().subscribe(x => {
        // TODO cache
        if (x && x.roles) {
          const permissions = _.concat([], ...x.roles.map(y => y.permissions));
          this.permissions = permissions.map(p => _.isString(p) ? p : p.permission);
        } else {
          this.permissions = [];
        }

        subject.next(this.permissions);
        subject.complete();
      });
      return subject.asObservable();
    } else {
      return of(this.permissions);
    }
  }

  hasPermission(right: string, params?: any): Observable<boolean> {
    const permissions = [right];
    return this.getPermissions().pipe(mergeMap(async userPermissions => {
      return await PermissionHelper.checkPermissions(userPermissions, permissions);
    }));
  }


  hasPermissionsFor(object: ISecuredResource): Observable<boolean> {
    const permissions = object.getPermissions().map(p => _.isString(p) ? p : p.permission);
    return this.getPermissions().pipe(mergeMap(async userPermissions => {
      return await PermissionHelper.checkPermissions(userPermissions, permissions);
    }));
  }


  getRoles(): Observable<string[]> {
    return this.getUser().pipe(map(x => x && x.roles ? _.map(x.roles, r => r.rolename) : []));
  }


  hasRole(role: string): Observable<boolean> {
    const subject = new Subject<boolean>();
    this.getRoles().subscribe(x => {
      subject.next(!!x.find(y => y === role));
      subject.complete();
    });
    return subject.asObservable();
  }


  hasRoutePermissions(route: ActivatedRouteSnapshot,
                      state: RouterStateSnapshot): Observable<boolean> {
    const permissions = UserAuthHelper.getRoutePermissions(route);
    if (_.isNull(permissions)) {
      // no permissions to check
      return new BehaviorSubject(true);
    }
    return this.getPermissions().pipe(mergeMap(async userPermissions => {
      return await PermissionHelper.checkPermissions(userPermissions, permissions);
    }));
  }


}
