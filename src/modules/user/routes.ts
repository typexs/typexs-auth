import {Routes} from '@angular/router';
import {UserLogoutComponent} from './components/logout/user_logout.component';
import {AuthGuardService, CTXT_ROUTE_USER_LOGOUT} from '@typexs/ng-base';
import {UserSignupComponent} from './components/signup/user_signup.component';
import {UserLoginComponent} from './components/login/user_login.component';
import {UserProfileComponent} from './components/profile/user_profile.component';

export const APP_ROUTES: Routes = [
  // TODO make this route configurable
  {
    path: 'user/signup',
    component: UserSignupComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Signup', isAuthenticated: false}
  },
  {
    path: 'user/login',
    component: UserLoginComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Login', isAuthenticated: false}
  },
  {
    path: 'user/profile',
    component: UserProfileComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Profile', isAuthenticated: true}
  },
  {
    path: 'user/logout',
    component: UserLogoutComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Logout', isAuthenticated: true, context: CTXT_ROUTE_USER_LOGOUT}
  }

];
