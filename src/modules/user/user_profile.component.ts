import {Component, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {Router} from "@angular/router";
import {User} from "../../entities/User";


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

  data: User;

  constructor(private auth: AuthService, private router: Router) {
  }


  async ngOnInit() {
    this.data = await this.auth.getUser();
    console.log(this.auth.getStoredToken())
  }


  isAuthenticated() {
    return this.data && this.auth.isAuthenticated();
  }

}
