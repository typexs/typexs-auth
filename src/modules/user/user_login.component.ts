import {Component, Input, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {validate} from "class-validator";
import * as _ from "lodash";
import {Router} from "@angular/router";


@Component({
  selector: 'user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit {

  auth_token: string;

  user: DefaultUserLogin;

  validation: { [key: string]: { valid: boolean, checked: boolean, messages: Array<{ type: string, content: string }> } } = {
    errors: {valid: false, checked: false, messages: []},
    username: {valid: false, checked: false, messages: []},
    password: {valid: false, checked: false, messages: []}
  };


  constructor(private auth: AuthService, private router: Router) {
  }


  ngOnInit() {
    // TODO must we wait here
    this.user = this.auth.newUserLogin();
  }


  async onSubmit() {
    let validation: boolean = true;
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

    if (validation) {
      // redirect to user
      let user = await this.auth.authenticate(this.user);
      if (user.isAuthenticated) {
        // is login successfull
        await this.router.navigateByUrl('/user');
      } else {

        if (_.isArray(user.errors)) {
          this.validation.errors.messages.push({type: 'error', content: JSON.stringify(user.errors)})
        } else {
          this.validation.errors.messages.push({type: 'error', content: 'UNKNOWN'})
        }
        this.validation.errors.valid = false;
        this.validation.errors.checked = true;
      }


    }


  }

}
