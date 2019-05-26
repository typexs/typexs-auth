import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Provider} from '@angular/compiler/src/core';
import {USER_ADMIN_ROUTES} from './user.admin.routes';
import {
  AdminModule,
  BaseAdminThemeModule,
  EntityModule,
  FormsModule,
  NavigatorModule,
  NavigatorService,
  SystemModule
} from '@typexs/ng-base';
import {PermissionsRolesComponent} from './permissions-roles.component';
import {BrowserModule} from '@angular/platform-browser';
import {UserModule} from '../user/user.module';

export const PROVIDERS: Provider[] = [];

@NgModule({
  declarations: [
    PermissionsRolesComponent
  ],
  imports: [
    RouterModule.forChild(USER_ADMIN_ROUTES),
    EntityModule,
    BrowserModule,
    FormsModule,
    SystemModule,
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
