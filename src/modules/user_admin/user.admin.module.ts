import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Provider} from "@angular/compiler/src/core";
import {USER_ADMIN_ROUTES} from "./user.admin.routes";
import {EntityModule, FormsModule, SystemModule} from "@typexs/ng-base";
import {PermissionsRolesComponent} from "./permissions-roles.component";
import {FormsModule as NgFormsModule} from "@angular/forms";
import {BrowserModule} from '@angular/platform-browser';

export const PROVIDERS: Provider[] = [];

@NgModule({
  declarations: [PermissionsRolesComponent],
  imports: [
    RouterModule.forChild(USER_ADMIN_ROUTES),
    EntityModule,
    BrowserModule,
    FormsModule,
    SystemModule
  ],
  exports: [PermissionsRolesComponent],
  providers: PROVIDERS
})
export class UserAdminModule {
  static forRoot() {
    return {
      ngModule: UserAdminModule,
      providers: PROVIDERS
    }
  }

}
