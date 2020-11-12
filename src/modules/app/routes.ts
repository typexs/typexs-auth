import {Routes} from '@angular/router';
import {DemosComponent} from './demos/demos.component';
import {UserLogoutComponent} from '../user/components/logout/user_logout.component';
import {
  AdminComponent,
  AuthGuardService,
  CTXT_ROUTE_USER_LOGOUT,
  CTXT_ROUTE_USER_PROFILE,
  DistributedStorageModule,
  EntityModule,
  StorageModule,
  TasksModule
} from '@typexs/ng-base';
import {BatAuthLoginComponent} from './demos/bat-auth-login/bat-auth-login.component';
import {BatAuthSignupComponent} from './demos/bat-auth-signup/bat-auth-signup.component';
import {BatAuthProfileComponent} from './demos/bat-auth-profile/bat-auth-profile.component';
import {PERM_ALLOW_ACCESS_USER_LIST} from './lib/Constants';
import {UsersListComponent} from './demos/bat-auth-users-list/users-list.component';


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
        data: {
          label: 'Profile',
          isAuthenticated: true,
          context: CTXT_ROUTE_USER_PROFILE,
          anonymView: 'hide'
        }
      },
      {
        path: 'users',
        component: UsersListComponent,
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
        data: {
          label: 'Logout',
          isAuthenticated: true,
          context: CTXT_ROUTE_USER_LOGOUT,
          anonymView: 'disable'
        }
      },
    ]
  },
  {
    path: 'admin', component: AdminComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Admin', group: 'admin'},
    children: [

      ...TasksModule.getRoutes(),
      ...StorageModule.getRoutes(),
      ...EntityModule.getRoutes(),
      ...DistributedStorageModule.getRoutes(),
    ]
  },
  {
    path: '', redirectTo: 'demo', pathMatch: 'full'
  },
  {
    path: '**', redirectTo: 'demo'
  }

];





