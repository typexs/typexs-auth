import {Component, OnInit} from '@angular/core';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {Router} from "@angular/router";
import {AuthService} from "@typexs/ng-base";


@Component({
  selector: 'user-signup',
  templateUrl: './user_signup.component.html',
})
export class UserSignupComponent implements OnInit {

  signup: DefaultUserSignup;

  constructor(private auth: AuthService<UserAuthServiceProvider>, private router: Router) {
  }


  ngOnInit() {
    // TODO check if signup supported
    // TODO must we wait here
    this.signup = this.auth.getProvider().newUserSignup();
  }


  isAuthenticated() {
    return this.auth.getProvider().isLoggedIn();
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
