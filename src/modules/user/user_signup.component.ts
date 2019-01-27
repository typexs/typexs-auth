import {Component, OnInit, Input} from '@angular/core';

import {DefaultUserSignup} from "../../libs/models/DefaultUserSignup";
import {Router} from "@angular/router";
import {UserAuthService} from "./user-auth.service";
import {AuthService, NavigatorService} from "@typexs/ng-base";
import * as _ from "lodash";
import {Helper} from "../../libs/Helper";


@Component({
  selector: 'user-signup',
  templateUrl: './user_signup.component.html',
})
export class UserSignupComponent implements OnInit {

  signup: DefaultUserSignup;


  @Input()
  successUrl: string | any[] = 'user/login';


  constructor(private authService: AuthService, private navigatorService: NavigatorService, private router: Router) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }


  ngOnInit() {
    // TODO check if signup supported
    // TODO must we wait here
    this.signup = this.getUserAuthService().newUserSignup();
    let init = this.authService.isInitialized();
    Helper.after(init, (x) => {
      if (x) {
        if (this.isAuthenticated()) {
          this.redirectOnSuccess();
        }
      }
    });
  }


  isAuthenticated() {
    return this.getUserAuthService().isLoggedIn();
  }

  async redirectOnSuccess() {
    if (_.isString(this.successUrl)) {
      let nav = this.navigatorService.entries.find(e => e.path && e.path.includes(<string>this.successUrl));
      if (nav) {
        await this.router.navigate([nav.getFullPath()]);
      } else {
        await this.router.navigate([this.successUrl]);
      }
    } else if (_.isArray(this.successUrl)) {
      await this.router.navigate(this.successUrl);
    }
  }


  async onSubmit($event: any) {
    if ($event.data.isSuccessValidated) {

      try {
        let data = await this.getUserAuthService().signup($event.data.instance);
        await this.redirectOnSuccess();
      } catch (e) {
        console.error(e);
      }

    } else {
      console.error($event);
    }

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
