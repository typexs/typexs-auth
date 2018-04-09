import {Component, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {Router} from "@angular/router";
import {DefaultUserData} from "../../libs/models/DefaultUserData";

/*
@NgRoute({
  path:'admin',
  data:{
    label: 'Admin'
  }
})
*/
@Component({
  selector: 'user-profile',
  templateUrl: './user_profile.components.html',
})
export class UserProfileComponent implements OnInit {

  data: DefaultUserData;

  constructor(private auth: AuthService, private router: Router) {

  }


  async ngOnInit() {
    this.data = await this.auth.getUser();
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }

}
