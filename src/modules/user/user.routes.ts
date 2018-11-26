import {UserProfileComponent} from "./user_profile.component";
import {AuthGuardService} from "@typexs/ng-base";
import {UserSignupComponent} from "./user_signup.component";
import {UserLoginComponent} from "./user_login.component";
import {UserLogoutComponent} from "./user_logout.component";

import {Routes} from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'user/profile',
    component: UserProfileComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Profile'}
  },
  {
    path: 'user/signup',
    component: UserSignupComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Register'}
  },
  {
    path: 'user/login',
    component: UserLoginComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Login'}
  },
  {
    path: 'user/logout',
    component: UserLogoutComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Logout'}
  }
]
