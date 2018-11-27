import {AuthService, IAuthGuardProvider, IMenuLinkGuard, NavEntry} from "@typexs/ng-base";
import {ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {Observable} from 'rxjs/Observable';
import {Injectable} from "@angular/core";
import * as _ from 'lodash';

@Injectable()
export class UserAuthGuardService implements IAuthGuardProvider, IMenuLinkGuard {

  constructor(private authService: AuthService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.hasRoutePermissions(route, state);
  }

  isDisabled(entry: NavEntry): boolean {
    const isAuth = _.get(entry, 'route.data.isAuthenticated', null);
    if (_.isBoolean(isAuth)) {
      return this.authService.isLoggedIn() != isAuth;
    }
    return false;
  }

  isHidden(entry: NavEntry): boolean {
    return false;
  }

}
