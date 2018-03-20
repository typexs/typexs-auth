import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {AbstractUserSignup} from "../../libs/models/AbstractUserSignup";
import {IAuthUser} from "../../libs/models/IAuthUser";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/publish";

@Injectable()
export class AuthUserService {

  private _initialized:boolean = false;

  private  _config:any = {

    authKey: "txs-auth"
  };


  private token: string;

  private user: IAuthUser;

  constructor(private http: HttpClient) {
    this.configure();
  }

  public isInitialized(){
    return this._initialized;
  }

  configure() {
    let config = this.http.get('/api/user/_config');
    config.subscribe(obj => {
      _.assign(this._config, obj);
      this._initialized = true;
    });
    return config;
  }


  get() {

  }


  signup(signup: AbstractUserSignup):Observable<any>{
    return this.http.post('/api/user/signup', signup);
  }

  /*

  login(login: AbstractUserLogin) {
    return this.http
      .post('/api/user/login',login,{ observe: 'response' })
      .subscribe(res => {
        // if exists
        this.token = res.headers.get(this._config.authKey);
      });
  }


  logout() {
    return this.http.get('/api/user/logout').subscribe();
  }
*/

}
