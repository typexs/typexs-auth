import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AbstractUserSignup} from '../../libs/models/AbstractUserSignup';
import {DefaultUserLogin} from '../../libs/models/DefaultUserLogin';
import {DefaultUserSignup} from '../../libs/models/DefaultUserSignup';
import {AbstractUserLogin} from '../../libs/models/AbstractUserLogin';
import {AbstractUserLogout} from '../../libs/models/AbstractUserLogout';
import {DefaultUserLogout} from '../../libs/models/DefaultUserLogout';
import {Observable, BehaviorSubject, of, Subject, Subscription} from 'rxjs';
import {IAuthServiceProvider} from '@typexs/ng-base/modules/base/api/auth/IAuthServiceProvider';
import {User} from '../../entities/User';
import {AuthMessage, LogMessage, MessageChannel, MessageService, MessageType, BackendService} from '@typexs/ng-base';
import {filter, first, map, mergeMap} from 'rxjs/operators';
import {IAuthSettings} from '../../libs/auth/IAuthSettings';
import {API_USER, API_USER_CONFIG, API_USER_IS_AUTHENTICATED, API_USER_LOGIN, API_USER_LOGOUT, API_USER_SIGNUP} from '../../libs/Constants';
import {ISecuredResource, PermissionHelper} from '@typexs/roles-api';
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

  private _initialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private prevAuth = false;

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

  private authCheckLoading = new BehaviorSubject(false);

  private permissions: string[];

  private authSubs: Subscription;

  constructor(private backendClientService: BackendService,
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


  configure(): Observable<any> {
    const subject = new Subject();
    const config = this.backendClientService.callApi(API_USER_CONFIG);
    config.subscribe(obj => {
      _.assign(this._config, obj);
      subject.next(true);
    }, error => {
      subject.error(error);
    }, () => {
      subject.complete();
    });
    return subject.asObservable();
  }


  /**
   * startup method to check if an existing token is still active
   */
  init() {
    this.prevAuth = this._isAuthenticated$.getValue();
    if (this.isEnabled()) {
      if (this.authSubs) {
        this.authSubs.unsubscribe();
      }
      // fetch current accessible routes
      this.backendClientService.getState()
        .pipe(filter(x => x === 'online'))
        .pipe(first())
        .pipe(mergeMap(x => this.backendClientService.reloadRoutes()))
        .pipe(mergeMap(x => {
          return this.configure();
        }))
        // .pipe(first())
        .pipe(mergeMap(x => {
          return this.checkAuthentication();
        }))
        // .pipe(first())
        .subscribe(x => {
          this.authSubs = this._isAuthenticated$
            .subscribe(y => {
              // reload routes on auth check
              if (this.prevAuth !== y) {
                this.prevAuth = y;
                this.backendClientService.reloadRoutes();
              }
            });
          if (this._initialized$.getValue() === false) {
            this._initialized$.next(true);
          }
        }, error => {
          this._initialized$.error(error);
        });
    } else {
      this._initialized$.next(true);
    }
    return this._initialized$;
  }


  private checkAuthentication() {
    this.connected = false;
    this.authCheckLoading.next(true);
    const checking = new Subject<boolean>();
    this.backendClientService.callApi<boolean>(API_USER_IS_AUTHENTICATED)
      .subscribe(
        value => {
          if (_.isString(value)) {
            if (value === 'true') {
              value = true;
            } else {
              value = false;
            }
          }
          this.connected = value;
          checking.next(value);
          this._isAuthenticated$.next(value);
          if (!value) {
            this.clearStoredToken();
          } else {
            this.getUser();
          }
        },
        error => {
          this.clearStoredToken();
          this._isAuthenticated$.error(error);
          checking.error(error);
        },
        () => {
          this.authCheckLoading.next(false);
          checking.complete();
        }
      );
    return checking;
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
    this.permissions = undefined;
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
    this.permissions = undefined;
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
    if (this.connected) {
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
            this.resetUser();
            this.loading = true;
            subject.next(null);
          },
          () => {
            this.loading = false;
            subject.complete();
          });
      }
    } else {
      subject.next(null);
      subject.complete();
    }
    return subject;
  }


  isAuthenticated() {
    const token = this.getStoredToken();
    const validToken = token != null && token === this.token;
    if (token && (!validToken || !this.connected) && !this.authCheckLoading.getValue()) {
      return this.checkAuthentication().pipe(mergeMap(x => this._isAuthenticated$));
    } else if (this.authCheckLoading.getValue()) {
      return this.authCheckLoading.pipe(filter(x => !x)).pipe(first()).pipe(mergeMap(x => this._isAuthenticated$));
    } else {
      return this._isAuthenticated$;
    }
  }


  isEnabled(): boolean {
    return true;
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
          subject.complete();
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
          const isAuthenticated = _.get(user, '$state.isAuthenticated', false);
          this.connected = true;
          if (isAuthenticated) {
            this.saveStoredToken(user.$state.token);
            this.setUser(user.$state.user);
          } else {
            login.resetSecret();
            this.clearStoredToken();
          }
          this._isAuthenticated$.next(isAuthenticated);
          subject.next(user);
        },
        error => {
          // login.addError({property: 'error', value: error.message, error: error});
          login.resetSecret();
          this.clearStoredToken();
          this._isAuthenticated$.next(false);
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
        this._isAuthenticated$.next(false);
        subject.next(user);
      },
      error => {
        this.loading = false;
        this.clearStoredToken();
        this._isAuthenticated$.next(false);
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
      return await PermissionHelper.checkOnePermission(userPermissions, permissions);
    }));
  }


  hasPermissionsFor(object: ISecuredResource): Observable<boolean> {
    const permissions = object.getPermissions().map(p => _.isString(p) ? p : p.permission);
    return this.getPermissions().pipe(mergeMap(async userPermissions => {
      return await PermissionHelper.checkOnePermission(userPermissions, permissions);
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
      return await PermissionHelper.checkOnePermission(userPermissions, permissions);
    }));
  }


}
