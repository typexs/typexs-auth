import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import * as _ from "lodash";
import {AuthService} from "@typexs/ng-base";
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService<UserAuthServiceProvider>) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const provider = this.auth.getProvider();
    let token = provider.getStoredToken();
    if (token && _.isString(token) && !_.isEmpty(token)) {
      console.log('token exists', token);
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

    return next.handle(request);
  }
}
