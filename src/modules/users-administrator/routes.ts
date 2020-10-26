import {Routes} from '@angular/router';
import {AuthGuardService} from '@typexs/ng-base';
import {PermissionsRolesComponent} from './components/permissions-roles/permissions-roles.component';
import {PERMISSION_ALLOW_ADMINISTER_PERMISSIONS} from '../../libs/Constants';

/**
 * TODO
 * - create user
 * - list users
 * - delete / disable users
 * - show user profile
 */
export const USER_ADMIN_ROUTES: Routes = [
  {
    path: 'admin/users/permissions',
    component: PermissionsRolesComponent,
    canActivate: [AuthGuardService],
    data: {
      label: 'Permissions',
      isAuthenticated: true,
      permissions: [PERMISSION_ALLOW_ADMINISTER_PERMISSIONS],
      group: 'admin'
    }
  }
];
