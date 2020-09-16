import {Routes} from '@angular/router';
import {DemosComponent} from './demos/demos.component';
import {UserLogoutComponent} from '../user/user_logout.component';
import {
  AuthGuardService,
  CTXT_ROUTE_USER_LOGOUT,
  CTXT_ROUTE_USER_PROFILE,
  DistributedStorageModule,
  EntityModule,
  StorageModule
} from '@typexs/ng-base';
import {BatAuthLoginComponent} from './demos/bat-auth-login/bat-auth-login.component';
import {BatAuthSignupComponent} from './demos/bat-auth-signup/bat-auth-signup.component';
import {BatAuthProfileComponent} from './demos/bat-auth-profile/bat-auth-profile.component';


export const APP_ROUTES: Routes = [
  {
    path: 'demo',
    component: DemosComponent,
    data: {label: 'Demo'},
  },
  {
    path: 'demo/user/signup',
    component: BatAuthSignupComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Signup', isAuthenticated: false}
  },
  {
    path: 'demo/user/login',
    component: BatAuthLoginComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Login', isAuthenticated: false}
  },
  {
    path: 'demo/user/profile',
    component: BatAuthProfileComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Profile', isAuthenticated: true, context: CTXT_ROUTE_USER_PROFILE}
  },
  {
    path: 'demo/user/logout',
    component: UserLogoutComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Logout', isAuthenticated: true, context: CTXT_ROUTE_USER_LOGOUT}
  },
  ...StorageModule.getRoutes().map(x => {
    x.path = 'admin/' + x.path;
    if (!x.data.skip) {
      x.data.group = 'admin';
    }
    return x;
  }),

  ...EntityModule.getRoutes().map(x => {
    x.path = 'admin/' + x.path;
    if (!x.data.skip) {
      x.data.group = 'admin';
    }
    return x;
  }),

  ...DistributedStorageModule.getRoutes().map(x => {
    x.path = 'admin/' + x.path;
    if (!x.data.skip) {
      x.data.group = 'admin';
    }
    return x;
  }),

  {
    path: '', redirectTo: 'demo', pathMatch: 'full'
  },
  {
    path: '**', redirectTo: 'demo'
  }

];





