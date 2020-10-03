import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {USER_ADMIN_ROUTES} from './routes';
import {
  AdminModule,
  BaseAdminThemeModule,
  EntityModule,
  FormsModule,
  NavigatorModule,
  NavigatorService,
  BaseModule
} from '@typexs/ng-base';
import {PermissionsRolesComponent} from './components/permissions-roles/permissions-roles.component';
import {BrowserModule} from '@angular/platform-browser';
import {UserModule} from '../user/module';

export const PROVIDERS: any[] = [];

@NgModule({
  declarations: [
    PermissionsRolesComponent
  ],
  imports: [
    RouterModule.forChild(USER_ADMIN_ROUTES),
    EntityModule,
    BrowserModule,
    FormsModule,
    BaseModule,
    AdminModule,
    NavigatorModule,
    UserModule,
    BaseAdminThemeModule
  ],
  exports: [
    PermissionsRolesComponent
  ],
  providers: PROVIDERS
})
export class UserAdminModule {

  static forRoot() {
    return {
      ngModule: UserAdminModule,
      providers: PROVIDERS
    };
  }

  constructor(private navigator: NavigatorService) {
    this.navigator.addGroupEntry('admin/users/.*', {label: 'Users', group: 'admin'});
  }

}
