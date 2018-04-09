import {Component, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {validate} from "class-validator";
import * as _ from "lodash";
import {Router} from "@angular/router";


@Component({
  selector: 'user-signup',
  templateUrl: './user_signup.component.html',
})
export class UserSignupComponent implements OnInit {

  auth_token: string;

  user: DefaultUserSignup;


  password_confirm: string;

  validation: { [key: string]: { valid: boolean, checked: boolean, messages: Array<{ type: string, content: string }> } } = {
    username: {valid: false, checked: false, messages: []},
    password: {valid: false, checked: false, messages: []},
    // password_confirm: {valid: false, checked: false, messages: []},
    mail: {valid: false, checked: false, messages: []}
  };

  constructor(private auth: AuthService,private router: Router) {

  }


  ngOnInit() {
    // TODO check if signup supported
    // TODO must we wait here
    this.user = this.auth.newUserSignup();


  }


  isAuthenticated() {
    return this.auth.isAuthenticated();
  }


  async onSubmit() {

    let validation:boolean = true;
    let results = await validate(this.user, {validationError: {target: false}});
    Object.keys(this.validation).forEach(key => {
      if (this.validation[key]) {
        let valid = this.validation[key];
        let found = _.find(results, {property: key});
        valid.messages = [];
        if (found) {
          valid.valid = false;
          Object.keys(found.constraints).forEach(c => {
            valid.messages.push({type: c, content: found.constraints[c]})
          })

        } else {
          valid.valid = true;
        }
        validation = validation && valid.valid;
        valid.checked = true;
      }
    });

    this.validation.password.messages = [];
    this.validation.password.valid = true;
    if (this.user.password !== this.password_confirm) {
      this.validation.password.messages.push({type: 'confirm', content: 'Password confirmation failed.'});
      this.validation.password.valid = false;
      validation = false;
    }
    this.validation.password.checked = true;

    if(validation){
      // redirect to login
      await this.auth.signup(this.user).toPromise();
      // TODO check results for problems maybe account a
      await this.router.navigateByUrl('/user/login');
    }

    // TODO validate password confirmation

  }

}
