import {NgModule} from '@angular/core';
import {UserProfileComponent} from './components/profile/user_profile.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {UserSignupComponent} from './components/signup/user_signup.component';
import {UserLoginComponent} from './components/login/user_login.component';
import {UserLogoutComponent} from './components/logout/user_logout.component';
import {FormsModule as NgFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AuthTokenInterceptor} from './authtoken.interceptor';
import {AuthGuardService, AuthService, BaseModule, FormsModule, NavigatorModule} from '@typexs/ng-base';
import {UserAuthGuardService} from './user-auth-guard.service';
import {APP_ROUTES} from './routes';
import {UserAuthService} from './user-auth.service';

const PROVIDERS = [
  {
    provide: AuthService,
    useClass: UserAuthService
  },
  {
    provide: AuthGuardService,
    useClass: UserAuthGuardService
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthTokenInterceptor,
    multi: true
  }

];

@NgModule({
  declarations: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  imports: [
    CommonModule,
    NgFormsModule,
    FormsModule,
    BaseModule,
    NavigatorModule
  ],
  exports: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  providers: PROVIDERS
})
export class UserModule {


  static getRoutes() {
    return APP_ROUTES;
  }

  static forRoot() {
    return {
      ngModule: UserModule,
      providers: PROVIDERS
    };
  }

  constructor(private authService: AuthService) {
  }


}
