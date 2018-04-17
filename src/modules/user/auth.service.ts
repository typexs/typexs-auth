import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {AbstractUserSignup} from "../../libs/models/AbstractUserSignup";
import {IAuthUser} from "../../libs/models/IAuthUser";
import "rxjs/add/operator/publish";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {AbstractUserLogin} from "../../libs/models/AbstractUserLogin";
import {AbstractUserLogout} from "../../libs/models/AbstractUserLogout";
import {DefaultUserLogout} from "../../libs/models/DefaultUserLogout";
import {Observable} from "rxjs/Observable";
import {AbstractUserData} from "../../libs/models/AbstractUserData";
import {DefaultUserData} from "../../libs/models/DefaultUserData";


@Injectable()
export class AuthService {

  private _initialized: boolean = false;

  private _config: any = {
    authKey: "txs-auth"
  };


  private token: string;

  private user: IAuthUser;

  private connected: boolean = true;


  private loading: boolean = false;

  constructor(private http: HttpClient) {
    // this.configure();
  }

  public isInitialized() {
    return this._initialized;
  }


  configure(): Observable<any> {
    let config = this.http.get('/api/user/_config');
    config.subscribe(obj => {
      _.assign(this._config, obj);
      this._initialized = true;
    });
    return config;
  }


  public getTokenKey() {
    return this._config.authKey;
  }


  public getStoredToken(): string {
    let token = localStorage.getItem('token.' + this.getTokenKey());
    return _.isUndefined(token) ? null : token;
  }

  saveStoredToken(token:string){
    localStorage.setItem('token.' + this.getTokenKey(), token);
  }

  clearStoredToken(){
    this.connected = false;
    localStorage.removeItem('token.' + this.getTokenKey());
  }


  /**
   * Method for interceptor to set the request token
   *
   * @param {string} token
   */
  public setToken(token: string): void {
    this.token = token;
  }


  getUser(): Promise<AbstractUserData> {
    this.loading = true;
    let req = this.http.get('/api/user');
    return new Promise((resolve, reject) => {
      req.subscribe(
        (user: AbstractUserData) => {
          console.log(user);
          this.loading = false;
          resolve(user);
        },
        (error: Error) => {
          console.error(error);
          this.loading = false;
          let user = new DefaultUserData();
          user.addError({property: 'error', value: error.message, error: error});
          resolve(user);
        }
      );
    });
  }


  isAuthenticated() /*:Observable<boolean>*/ {
    // TODO check if token is expired
    let token = this.getStoredToken();
    return this.connected && this.getStoredToken() != null && token === this.token;
    //return this.http.get()
  }


  /**
   * startup method to check if an existing token is still active
   */
  initialAuthCheck() {
    let token = this.getStoredToken();
    if (token) {
      let req = this.http.get('/api/user/isAuthenticated');
      this.connected = false;
      req.subscribe(
        (res: boolean) => {
          console.log('check out = ' + res);
          this.connected = res;
          if(!res){
            this.clearStoredToken();
          }

        },
        (error: Error) => {
          console.error(error);
          this.loading = false;
          this.clearStoredToken();
        }
      );
    }
  }



  /*
  signup(signup: AbstractUserSignup):Observable<any>{
    return this.http.post('/api/user/signup', signup);
  }
  */

  signup(signup: AbstractUserSignup): Promise<AbstractUserSignup> {
    this.loading = true;
    let signupReq = this.http.post('/api/user/signup', signup);
    return new Promise((resolve, reject) => {
      signupReq.subscribe(
        (user: AbstractUserSignup) => {
          this.loading = false;
          console.log(user);
          this.connected = false;
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          this.connected = false;
          signup.addError({property: 'error', value: error.message, error: error});
          signup.resetSecret();
          console.error(error);
          resolve(signup);
        }
      );
    });
  }


  authenticate(login: AbstractUserLogin): Promise<AbstractUserLogin> {
    this.loading = true;
    let loginReq = this.http.post('/api/user/login', login);

    return new Promise((resolve, reject) => {
      loginReq.subscribe(
        (user: AbstractUserLogin) => {
          this.loading = false;
          this.connected = true;
          console.log(user);
          this.saveStoredToken(user.token);
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          this.connected = false;
          login.addError({property: 'error', value: error.message, error: error});
          login.resetSecret();
          this.clearStoredToken();

          console.error(error);
          resolve(login);
        }
      );
    })
  }



  logout(logout: AbstractUserLogout): Promise<AbstractUserLogout> {
    this.loading = true;
    let req = this.http.get('/api/user/logout');

    return new Promise((resolve, reject) => {
      req.subscribe(
        (user: AbstractUserLogout) => {
          console.log(user);
          this.loading = false;
          this.clearStoredToken();
          resolve(user);
        },
        (error: Error) => {
          console.error(error);
          this.loading = false;
          this.clearStoredToken();
          logout.addError({property: 'error', value: error.message, error: error});
          resolve(logout);
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
  newUserLogin(): DefaultUserLogin {
    return new DefaultUserLogin();
  }

  /**
   * Method for getting the suitable user login model, depending of used adapter
   *
   * TODO Impl. support mulitple adapter
   *
   * @returns {DefaultUserLogin}
   */
  newUserSignup(): DefaultUserSignup {
    return new DefaultUserSignup();
  }

  newUserLogout(): DefaultUserLogout {
    return new DefaultUserLogout();
  }


}
