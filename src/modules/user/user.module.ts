import {NgModule, APP_INITIALIZER} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserProfileComponent} from './user_profile.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import {UserSignupComponent} from "./user_signup.component";
import {UserLoginComponent} from "./user_login.component";
import {UserLogoutComponent} from "./user_logout.component";
import {FormsModule as NgFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {AuthTokenInterceptor} from "./authtoken.interceptor";
import {

  AuthGuardService,
  AuthService,
  FormsModule,
  NavigatorModule,
  SystemModule
} from "@typexs/ng-base";
import {UserAuthGuardService} from "./user-auth-guard.service";
import {APP_ROUTES} from "./user.routes";
import {UserAuthService} from "./user-auth.service";

const PROVIDERS = [
  UserAuthService,
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
  },

  {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [AuthService],
    useFactory: function (auth: AuthService) {

      async function startup() {
        console.log('startup')
        await (<any>auth).configure().toPromise();
        await (<any>auth).initialAuthCheck();
      }

      return startup;

    }
  }

]

@NgModule({
  declarations: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  imports: [
    RouterModule.forChild(APP_ROUTES),
    CommonModule,
    HttpClientModule,
    NgFormsModule,
    FormsModule,
    SystemModule,
    NavigatorModule
  ],
  exports: [RouterModule],
  providers: PROVIDERS
})
export class UserModule {
  static forRoot() {
    return {
      ngModule: UserModule,
      providers: PROVIDERS
    }
  }

}
