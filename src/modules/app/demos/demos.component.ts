import {Component, ViewEncapsulation} from '@angular/core';
import {AuthService} from "@typexs/ng-base";
import {UserAuthServiceProvider} from "../../user/user-auth-service-provider.service";


@Component({
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DemosComponent {
  title = 'TypexsAuth';

  constructor(private auth: AuthService<UserAuthServiceProvider>){}


  isAuthenticated(){
    return this.auth.isLoggedIn();
  }
}
