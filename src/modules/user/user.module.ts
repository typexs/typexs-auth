import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserProfileComponent} from './user_profile.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {UserSignupComponent} from "./user_signup.component";
import {UserLoginComponent} from "./user_login.component";
import {UserLogoutComponent} from "./user_logout.component";
import {FormsModule as NgFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {AuthTokenInterceptor} from "./authtoken.interceptor";
import {AUTH_SERVICE_GUARD_PROVIDER, AUTH_SERVICE_PROVIDER, FormsModule, SystemModule} from "@typexs/ng-base";
import {UserAuthGuardProvider} from "./UserAuthGuardProvider";
import {APP_ROUTES} from "./user.routes";

const PROVIDERS = [
  {
    provide: AUTH_SERVICE_PROVIDER,
    useClass: UserAuthServiceProvider
  },
  {
    provide: AUTH_SERVICE_GUARD_PROVIDER,
    useClass: UserAuthGuardProvider
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
        deps: [UserAuthServiceProvider],


        useFactory: function (auth:UserAuthServiceProvider) {


          async function startup() {
            await auth.configure().toPromise();
            await auth.initialAuthCheck();
          }

          return startup;

      }
    }
          */
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
    SystemModule
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
