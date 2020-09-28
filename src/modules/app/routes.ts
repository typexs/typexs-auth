import {Routes} from '@angular/router';
import {DemosComponent} from './demos/demos.component';
import {UserLogoutComponent} from '../user/components/logout/user_logout.component';
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
import {PERM_ALLOW_ACCESS_USER_LIST} from './lib/Constants';


export const APP_ROUTES: Routes = [
  {
    path: 'demo',
    component: DemosComponent,
    data: {label: 'Demo'},
    children: [
      {
        path: 'user/signup',
        component: BatAuthSignupComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Signup', isAuthenticated: false, anonymView: 'hide'
        }
      },
      {
        path: 'user/login',
        component: BatAuthLoginComponent,
        canActivate: [AuthGuardService],
        data: {label: 'Login', isAuthenticated: false, anonymView: 'disable'}
      },
      {
        path: 'user/profile',
        component: BatAuthProfileComponent,
        canActivate: [AuthGuardService],
        data: {label: 'Profile', isAuthenticated: true, context: CTXT_ROUTE_USER_PROFILE, anonymView: 'hide'}
      },
      {
        path: 'users',
        component: BatAuthProfileComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Users list',
          permissions: [PERM_ALLOW_ACCESS_USER_LIST],
          anonymView: 'hide'
        }
      },
      {
        path: 'user/logout',
        component: UserLogoutComponent,
        canActivate: [AuthGuardService],
        data: {label: 'Logout', isAuthenticated: true, context: CTXT_ROUTE_USER_LOGOUT, anonymView: 'disable'}
      },
    ]
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




