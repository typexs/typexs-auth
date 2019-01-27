import {AuthMessage, AuthService, IAuthGuardProvider, IMenuLinkGuard, NavEntry} from "@typexs/ng-base";
import {ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable} from "@angular/core";
import * as _ from 'lodash';


@Injectable()
export class UserAuthGuardService implements IAuthGuardProvider, IMenuLinkGuard {


  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(true);

  isNotAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject(false);


  constructor(private authService: AuthService) {
    authService.getChannel().subscribe(this.onMessage.bind(this));
    this._update();
  }

  private _update(){
    const auth = this.authService.isLoggedIn();
    this.isAuthenticated.next(auth == false);
    this.isNotAuthenticated.next(auth == true);
  }

  async onMessage(m: any) {

    if (m instanceof AuthMessage) {
      this._update();
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.hasRoutePermissions(route, state);
  }

  isDisabled(entry: NavEntry): Observable<boolean> {

    const isAuth = _.get(entry, 'route.data.isAuthenticated', null);
    if (_.isBoolean(isAuth)) {
      if (isAuth) {
        return this.isAuthenticated.asObservable();
      } else {
        return this.isNotAuthenticated.asObservable();
      }
    }
    return new Observable<boolean>(subscriber => subscriber.next(false));
  }

  isShown(entry: NavEntry): Observable<boolean> {
    return new Observable<boolean>(subscriber => subscriber.next(true));
  }

}
