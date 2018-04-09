import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {AbstractUserSignup} from "../../libs/models/AbstractUserSignup";
import {IAuthUser} from "../../libs/models/IAuthUser";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/publish";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import { HttpRequest } from '@angular/common/http';
import {AbstractUserLogin} from "../../libs/models/AbstractUserLogin";


@Injectable()
export class AuthService {

  private _initialized:boolean = false;

  private  _config:any = {
    authKey: "txs-auth"
  };


  private token: string;

  private user: IAuthUser;

  private loading:boolean = false;

  constructor(private http: HttpClient) {
    // this.configure();
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


  public getTokenKey(){
    return this._config.authKey;
  }


  public getToken(): string {
    return localStorage.getItem('token.'+this.getTokenKey());
  }

  public setToken(token:string): void {
    this.token = token;
  }


  isAuthenticated() /*:Observable<boolean>*/{
    // TODO check if token is expired
    return this.getToken() != null;
    //return this.http.get()
  }


  signup(signup: AbstractUserSignup):Observable<any>{
    return this.http.post('/api/user/signup', signup);
  }


  authenticate(login: AbstractUserLogin):Promise<AbstractUserLogin>{
    this.loading = true;
    let loginReq = this.http.post('/api/user/login', login);

    return new Promise((resolve, reject) => {
      loginReq.subscribe(
        (user:AbstractUserLogin) => {
          this.loading = false;
          console.log(user);
          localStorage.setItem('token.'+this.getTokenKey(),this.token);
          resolve(user);
        },
        (error:Error) => {
          this.loading = false;
          login.addError({property:'error',value:error.message,error:error});
          login.resetSecret();
          console.error(error);
          resolve(login);
        }
      );

    })



  }

  /**
   * Method for getting the suitable user login model, depending of used adapter
   *
   * TODO Impl. support mulitple adapter
   *
   * @returns {DefaultUserLogin}
   */
  newUserLogin():DefaultUserLogin{
    return new DefaultUserLogin();
  }

  /**
   * Method for getting the suitable user login model, depending of used adapter
   *
   * TODO Impl. support mulitple adapter
   *
   * @returns {DefaultUserLogin}
   */
  newUserSignup():DefaultUserSignup{
    return new DefaultUserSignup();
  }

  get() {

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
