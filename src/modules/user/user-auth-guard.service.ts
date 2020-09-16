import {AuthMessage, AuthService, IAuthGuardProvider, IMenuLinkGuard, NavEntry} from '@typexs/ng-base';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Rx';
import {switchMap, tap} from 'rxjs/operators';
import {PermissionHelper} from '@typexs/roles-api/index';


@Injectable()
export class UserAuthGuardService implements IAuthGuardProvider, IMenuLinkGuard {

  subscription: Subscription;

  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(true);

  isNotAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(false);

  hasPermissions: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  hasPermissions$: Observable<string[]> = this.hasPermissions.asObservable();


  constructor(private authService: AuthService) {
    authService.getChannel().subscribe(this.onMessage.bind(this));
    authService.isInitialized().subscribe(x => {
      this._update();
    });
  }

  private _update() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.authService.isLoggedIn()
      .pipe(tap(
        auth => {
          this.isAuthenticated.next(auth === false);
          this.isNotAuthenticated.next(auth === true);
        })).pipe(switchMap(auth => {
        if (auth) {
          return this.authService.getPermissions();
        } else {
          return of(false);
        }
      }))
      .subscribe(async permissions => {

        if (permissions && !_.isBoolean(permissions)) {
          this.hasPermissions.next(permissions);
          // for (const perms of this.checkPermissions) {
          //   perms.subject.next(
          //     await PermissionHelper.checkPermissions(permissions, perms.permissions)
          //   );
          // }

        } else {
          this.hasPermissions.next([]);
        }
      });

  }

  // private recheckPermissions(user){
  //
  // }

  async onMessage(m: any) {
    if (m instanceof AuthMessage) {
      this._update();
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.hasRoutePermissions(route, state);
  }

  /**
   * Mark a link as disabled
   * @param entry
   */
  isDisabled(entry: NavEntry): Observable<boolean> {
    const isAuth = _.get(entry, 'route.data.isAuthenticated', null);
    if (_.isBoolean(isAuth)) {
      if (isAuth) {
        return this.isAuthenticated.asObservable();
      } else {
        return this.isNotAuthenticated.asObservable();
      }
    }
    return of(false);
  }

  /**
   * Do not show if permissions are missing
   *
   * @param entry
   */
  isShown(entry: NavEntry): Observable<boolean> {
    const permissions = _.get(entry, 'route.data.permissions', null);
    if (permissions) {
      return new Observable(subscriber => {
        this.hasPermissions$.subscribe(async userPermission => {
          subscriber.next(await PermissionHelper.checkPermissions(userPermission, permissions));
        });
      });
    } else {
      return of(true);
    }
  }

}
