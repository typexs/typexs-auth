import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserProfileComponent} from './user_profile.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {AuthService} from "./auth.service";
import {UserSignupComponent} from "./user_signup.component";
import {UserLoginComponent} from "./user_login.component";
import {UserLogoutComponent} from "./user_logout.component";
import {FormsModule as NgFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {AuthTokenInterceptor} from "./authtoken.interceptor";
import {FormsModule, SystemModule} from "@typexs/ng-base";
import {AuthService as BaseAuthService} from "@typexs/ng-base/modules/system/api/auth/auth.service";


@NgModule({
  declarations: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  imports: [
    RouterModule.forChild([
      {path: 'user', component: UserProfileComponent, data: {label: 'Profile'}},
      {path: 'user/signup', component: UserSignupComponent, data: {label: 'Register'}},
      {path: 'user/login', component: UserLoginComponent, data: {label: 'Login'}},
      {path: 'user/logout', component: UserLogoutComponent, data: {label: 'Logout'}}
    ]),
    CommonModule,
    HttpClientModule,
    NgFormsModule,
    FormsModule,
    SystemModule
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: BaseAuthService,
      useClass: AuthService
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInterceptor,
      multi: true
    },
    /*
        {
          provide: APP_INITIALIZER,
          multi: true,
          deps: [AuthService],


          useFactory: function (auth:AuthService) {


            async function startup() {
              await auth.configure().toPromise();
              await auth.initialAuthCheck();
            }

            return startup;

        }
      }
            */
  ]
})
export class UserModule {


}
