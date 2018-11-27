import {Component, ViewEncapsulation} from '@angular/core';
import {AuthService} from "@typexs/ng-base";



@Component({
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DemosComponent {
  title = 'TypexsAuth';

  constructor(private auth: AuthService){}


  isAuthenticated(){
    return this.auth.isLoggedIn();
  }
}
