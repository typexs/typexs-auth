import {AuthMessage, AuthService, IAuthGuardProvider, IMenuLinkGuard, NavEntry} from '@typexs/ng-base';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable, BehaviorSubject, of, Subject, Subscription} from 'rxjs';
import {Injectable} from '@angular/core';
import * as _ from 'lodash';
import {filter, mergeMap, tap} from 'rxjs/operators';
import {PermissionHelper} from '@typexs/roles-api';
import {UserAuthHelper} from './lib/UserAuthHelper';
import {Route} from '@angular/compiler/src/core';

// import {Log} from '@typexs/ng-base/modules/base/lib/log/Log';


/**
 * UserAuthGuard protects paths from unallowed access or allow access to verified users
 *
 * A route can be marked as "to authenticate" which is setted by parameter
 * isAuthenticated in the data object of the route, for example:
 *
 * ```
 * {
 *   path: 'secured'
 *   data: {
 *     isAuthenticated: true | false
 *     anonymView: 'hide' | 'disable' (default: 'disable')
 *   }
 * }
 * ```
 *
 * When it is false then route will be only shown (or enabled; depends on 'anonymView' parameter)
 * when an authentication is necessary, but the current user isn't authenticated.
 * For example "Sign-In" view should be only accessible for not authenicated users.
 *
 *
 *
 */
@Injectable()
export class UserAuthGuardService implements IAuthGuardProvider, IMenuLinkGuard {

  subscription: Subscription;

  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(false);

  isNotAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(true);

  hasPermissions: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  hasPermissions$: Observable<string[]> = this.hasPermissions.asObservable();

  isReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private authService: AuthService) {
    authService.getChannel().subscribe(this.onMessage.bind(this));
    authService.isInitialized().subscribe(x => {
      if (x) {
        this._update();
      }
    });
  }

  private _update() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.authService.isLoggedIn()
      .pipe(tap(
        auth => {
          this.isAuthenticated.next(auth === true);
          this.isNotAuthenticated.next(auth === false);
        }))
      .pipe(mergeMap(auth => {
        if (auth) {
          return this.authService.getPermissions();
        } else {
          return of(false);
        }
      }))
      .subscribe(async permissions => {
        if (permissions && !_.isBoolean(permissions)) {
          this.hasPermissions.next(permissions);
        } else {
          this.hasPermissions.next([]);
        }
        if (this.isReady.getValue() === false) {
          this.isReady.next(true);
        }
      });
  }


  async onMessage(m: any) {
    if (m instanceof AuthMessage) {
      this._update();
    }
  }


  /**
   * Checks if a route can be accessed.
   *
   * @param route
   * @param state
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.authService.isEnabled() || !UserAuthHelper.hasRouteAuthCheck(route)) {
      return new BehaviorSubject(true);
    }
    return this.checkAccess(route, false);
  }


  /**
   * Mark a link as disabled
   * @param entry
   */
  isDisabled(entry: NavEntry): Observable<boolean> {
    const check = UserAuthHelper.checkIfAuthRequired(entry.route);
    if (_.isNull(check)) {
      return new BehaviorSubject(false);
    }
    const status = UserAuthHelper.getRouteDisallowViewMode(entry.route);
    if (status !== 'disable') {
      return new BehaviorSubject(false);
    }
    return this.checkAccess(entry.route).pipe(mergeMap(x => of(!x)));
  }


  /**
   * Do not show if permissions are missing
   *
   * @param entry
   */
  isShown(entry: NavEntry): Observable<boolean> {
    const check = UserAuthHelper.checkIfAuthRequired(entry.route);
    if (_.isNull(check)) {
      return new BehaviorSubject(true);
    }
    const status = UserAuthHelper.getRouteDisallowViewMode(entry.route);
    if (status !== 'hide') {
      return new BehaviorSubject(true);
    }
    return this.checkAccess(entry.route);
  }


  private checkAccess(route: Route, subscribe: boolean = true): Observable<boolean> {
    const hasAuth = UserAuthHelper.checkIfAuthRequired(route);
    if (_.isBoolean(hasAuth)) {
      if (this.isReady.getValue() === true) {
        return this.validateAccess(hasAuth, route, subscribe);
      } else {
        // @ts-ignore
        return this.isReady.pipe(filter(x => x)).pipe(mergeMap(x => {
          return this.validateAccess(hasAuth, route, subscribe);
        }));
      }
    }
    return new BehaviorSubject(true);
  }

  private validateAccess(hasAuth: boolean, route: Route, subscribe: boolean = true): Observable<boolean> {
    const permissions = UserAuthHelper.getRoutePermissions(route);
    if (_.isNull(permissions)) {
      // no special permissions needed
      if (hasAuth) {
        return this.isAuthenticated;
      } else {
        return this.isNotAuthenticated;
      }
    } else {
      if (subscribe) {
        const x = new BehaviorSubject(false);
        this.hasPermissions$.subscribe(async userPermission => {
          const allowed = await PermissionHelper.checkOnePermission(userPermission, permissions);
          x.next(allowed);
        });
        return x;
      } else {
        const x = new Subject<boolean>();
        this.hasPermissions$.subscribe(async userPermission => {
          const allowed = await PermissionHelper.checkOnePermission(userPermission, permissions);
          x.next(allowed);
        });
        return x;
      }
    }
  }
}
