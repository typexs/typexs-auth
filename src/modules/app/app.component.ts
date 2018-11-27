import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {StartupService} from "./startup.service";
import {AuthService} from "@typexs/ng-base";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(public auth: AuthService, private startup:StartupService) {
    console.log(auth)
  }

  async ngOnInit() {
  }

  isAuthenticated(){
    return this.auth.isLoggedIn();
  }
}


