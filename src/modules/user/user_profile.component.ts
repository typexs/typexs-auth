import {Component, OnInit} from '@angular/core';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {Router} from "@angular/router";
import {User} from "../../entities/User";
import {AuthService} from "@typexs/ng-base";


@Component({
  selector: 'user-profile',
  templateUrl: './user_profile.components.html',
})
export class UserProfileComponent implements OnInit {

  data: User;

  constructor(private auth: AuthService<UserAuthServiceProvider>, private router: Router) {
  }


  async ngOnInit() {
    this.data = await <User>this.auth.getUser();
    console.log(this.auth.getProvider().getStoredToken())
  }


  isAuthenticated() {
    return this.data && this.auth.getProvider().isAuthenticated();
  }

}
