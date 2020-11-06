import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_MODULES} from './app.used.modules';
import {DemosComponent} from './demos/demos.component';
import {AuthGuardService, AuthService, DistributedStorageService, EntityService, NavigatorService, StorageService} from '@typexs/ng-base';
import {BatAuthProfileComponent} from './demos/bat-auth-profile/bat-auth-profile.component';
import {BatAuthSignupComponent} from './demos/bat-auth-signup/bat-auth-signup.component';
import {BatAuthLoginComponent} from './demos/bat-auth-login/bat-auth-login.component';
import {UsersListComponent} from './demos/bat-auth-users-list/users-list.component';


@NgModule({
  declarations: [
    AppComponent,
    DemosComponent,
    BatAuthProfileComponent,
    BatAuthSignupComponent,
    BatAuthLoginComponent,
    UsersListComponent
  ],
  imports: APP_MODULES,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(
    private authService: AuthService,
    private authGuardService: AuthGuardService,
    private navigatorService: NavigatorService,
    private storageService: StorageService,
    private entityService: EntityService,
    private dStorageService: DistributedStorageService
  ) {
    entityService.setNgUrlPrefix('/admin/entity');
    storageService.setNgUrlPrefix('/admin/storage');
    dStorageService.setNgUrlPrefix('/admin/distributed-storage');

    this.navigatorService.addGroupEntry('admin/entity/.*', {label: 'Entity', group: 'admin'});
    this.navigatorService.addGroupEntry('admin/storage/.*', {label: 'Storage', group: 'admin'});
    this.navigatorService.addGroupEntry('admin/distributed-storage/.*', {label: 'Distributed Storage', group: 'admin'});

    authService.init();
    // authGuardService.init();
  }


}
