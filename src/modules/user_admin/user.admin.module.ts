import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Provider} from "@angular/compiler/src/core";
import {APP_ROUTES} from "../user/user.routes";

export const PROVIDERS: Provider[] = [];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(APP_ROUTES),
  ],
  exports: [],
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
