import * as _ from 'lodash';
import {ActivatedRouteSnapshot} from '@angular/router';
import {Route} from '@angular/compiler/src/core';
import {K_ANONYM_VIEW, K_IS_AUTHENTICATED, K_PERMISSIONS} from './Constants';

export class UserAuthHelper {


  static getRoutePermissions(route: ActivatedRouteSnapshot | Route, replaceParams: boolean = true) {
    let perms = _.get(route, 'data.' + K_PERMISSIONS, null);
    if (perms && _.isArray(perms) && replaceParams && route instanceof ActivatedRouteSnapshot) {
      perms = perms.map((x: string) => {
        let y = x;
        route.paramMap.keys.forEach(k => {
          y = y.replace(':' + k + ' ', route.paramMap.get(k) + ' ');
        });
        return y;
      });

    }
    return perms;
  }


  static getRouteAuthenticationCheck(route: ActivatedRouteSnapshot | Route) {
    return _.get(route, 'data.' + K_IS_AUTHENTICATED, null);
  }

  static getRouteDisallowViewMode(route: ActivatedRouteSnapshot | Route): 'hide' | 'disable' {
    return _.get(route, 'data.' + K_ANONYM_VIEW, 'hide');
  }

  /**
   * Return true if authentication is necessary for the route access or false if show only when user is not authenticated.
   * @param route
   */
  static checkIfAuthRequired(route: ActivatedRouteSnapshot | Route) {
    const hasAuth = this.getRouteAuthenticationCheck(route);
    if (_.isBoolean(hasAuth)) {
      return hasAuth;
    }

    const hasPermis = this.getRoutePermissions(route);
    if (!_.isNull(hasPermis)) {
      return true;
    }
    return null;
  }

  static hasRouteAuthCheck(route: ActivatedRouteSnapshot | Route) {
    const hasAuth = this.getRouteAuthenticationCheck(route);
    if (!_.isNull(hasAuth)) {
      return true;
    }
    const hasPermissions = this.getRoutePermissions(route);
    if (!_.isNull(hasPermissions)) {
      return true;
    }
    return false;

  }

}
