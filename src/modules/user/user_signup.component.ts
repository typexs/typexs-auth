import {Component, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {Router} from "@angular/router";


@Component({
  selector: 'user-signup',
  templateUrl: './user_signup.component.html',
})
export class UserSignupComponent implements OnInit {

  //auth_token: string;

  signup: DefaultUserSignup;
/*
  password_confirm: string;

  validation: { [key: string]: { valid: boolean, checked: boolean, messages: Array<{ type: string, content: string }> } } = {
    errors: {valid: false, checked: false, messages: []},
    username: {valid: false, checked: false, messages: []},
    password: {valid: false, checked: false, messages: []},
    mail: {valid: false, checked: false, messages: []}
  };
*/
  constructor(private auth: AuthService, private router: Router) {
  }


  ngOnInit() {
    // TODO check if signup supported
    // TODO must we wait here
    this.signup = this.auth.newUserSignup();
  }


  isAuthenticated() {
    return this.auth.isAuthenticated();
  }


  async onSubmit($event:any){
    console.log($event);
  }



/*
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

    this.validation.password.messages = [];
    this.validation.password.valid = true;
    if (this.user.password !== this.password_confirm) {
      this.validation.password.messages.push({type: 'confirm', content: 'Password confirmation failed.'});
      this.validation.password.valid = false;
      validation = false;
    }
    this.validation.password.checked = true;

    if (validation) {
      // redirect to login
      let signup = await this.auth.signup(this.user);
      if (signup.success) {
        await this.router.navigateByUrl('/user/login');
      } else {
        if (_.isArray(signup.errors)) {
          this.validation.errors.messages.push({type: 'error', content: JSON.stringify(signup.errors)})
        } else {
          this.validation.errors.messages.push({type: 'error', content: 'UNKNOWN'})
        }
        this.validation.errors.valid = false;
        this.validation.errors.checked = true;

      }

      // TODO check results for problems maybe account a

    }

    // TODO validate password confirmation

  }
*/
}
