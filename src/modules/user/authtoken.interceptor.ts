import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import * as _ from "lodash";
import {AuthService} from "@typexs/ng-base";
import {UserAuthService} from "./user-auth.service";

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(this.auth instanceof UserAuthService){
      const provider = <UserAuthService>this.auth;

      let token = provider.getStoredToken();
      if (token && _.isString(token) && !_.isEmpty(token)) {
        let tokenKey = provider.getTokenKey();
        let setHeaders = {};
        setHeaders[tokenKey] = token;
        provider.setToken(token);
        request = request.clone({
          setHeaders: setHeaders
        });
      } else {
        provider.setToken(null);
      }

    }

    return next.handle(request);
  }
}
