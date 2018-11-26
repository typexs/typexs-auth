import {Component, OnInit} from '@angular/core';
import {AuthService} from "@typexs/ng-base";
import {UserAuthServiceProvider} from "../user/user-auth-service-provider.service";
import {StartupService} from "./startup.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(public auth: AuthService<UserAuthServiceProvider>, private startup:StartupService) {
    console.log(auth)
  }

  async ngOnInit() {
  }

  isAuthenticated(){
    return this.auth.isLoggedIn();
  }
}


