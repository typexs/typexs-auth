import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {Observable} from "rxjs/Observable";
import * as _ from "lodash";

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this.auth.getStoredToken();
    if(token && _.isString(token) && !_.isEmpty(token)){
      console.log('token exists',token);
      let tokenKey = this.auth.getTokenKey();
      let setHeaders = {};
      setHeaders[tokenKey] = token;
      this.auth.setToken(token);
      request = request.clone({
        setHeaders: setHeaders
      });
    }else{
      this.auth.setToken(null);
    }

    return next.handle(request);
  }
}
