import {IAuthGuardProvider} from "@typexs/ng-base";
import {ActivatedRouteSnapshot,RouterStateSnapshot} from "@angular/router";
import {Observable} from 'rxjs/Observable';

export class UserAuthGuardProvider implements IAuthGuardProvider {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }

}
