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


  public getToken(): string {
    return localStorage.getItem('token.' + this.getTokenKey());
  }

  public setToken(token: string): void {
    this.token = token;
  }


  getUser():Promise<AbstractUserData> {
    this.loading = true;
    let req = this.http.get('/api/user');
    return new Promise((resolve, reject) => {
      req.subscribe(
        (user: AbstractUserData) => {
          this.loading = false;
          console.log(user);
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          let user = new DefaultUserData();
          user.addError({property: 'error', value: error.message, error: error});
          console.error(error);
          resolve(user);
        }
      );
    });
  }


  isAuthenticated() /*:Observable<boolean>*/ {
    // TODO check if token is expired
    return this.getToken() != null;
    //return this.http.get()
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
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
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
          console.log(user);
          localStorage.setItem('token.' + this.getTokenKey(), this.token);
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          login.addError({property: 'error', value: error.message, error: error});
          login.resetSecret();
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
          this.loading = false;
          console.log(user);
          resolve(user);
        },
        (error: Error) => {
          this.loading = false;
          logout.addError({property: 'error', value: error.message, error: error});
          console.error(error);
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
