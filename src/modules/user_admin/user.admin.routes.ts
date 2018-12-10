import {Routes} from '@angular/router';
import {AuthGuardService} from "@typexs/ng-base";
import {PermissionsRolesComponent} from "./permissions-roles.component";

export const USER_ADMIN_ROUTES: Routes = [
  {
    path: 'admin/users/permissions',
    component: PermissionsRolesComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Permissions', isAuthenticated: true, group: 'admin'}
  }
]
