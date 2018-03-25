import {Component, Input, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";

@Component({
  selector: 'user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit{

  auth_token: string;

  user: DefaultUserLogin;

  constructor(private auth: AuthService){}


  ngOnInit(){
    // TODO must we wait here
    this.user = this.auth.newUserLogin();
  }



  onSubmit() {  }

}
