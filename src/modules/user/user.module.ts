import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {UserProfileComponent} from './user_profile.component';
import {HttpClientModule} from '@angular/common/http';
import {AuthUserService} from "./user.service";
import {UserSignupComponent} from "./user_signup.component";
import {UserLoginComponent} from "./user_login.component";
import {UserLogoutComponent} from "./user_logout.component";


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
      ]
    ),
    HttpClientModule
  ],
  exports: [RouterModule],
  providers: [AuthUserService]
})
export class UserModule {

}
