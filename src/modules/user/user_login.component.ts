import {Component, OnInit} from '@angular/core';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {Router} from "@angular/router";
import {AuthService} from "@typexs/ng-base";


@Component({
  selector: 'user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit {

  auth_token: string;

  user: DefaultUserLogin;


  constructor(private authService: AuthService<UserAuthServiceProvider>, private router: Router) {
  }


  ngOnInit() {
    // TODO must we wait here
    this.user = this.authService.getProvider().newUserLogin();
  }


  async onSubmit($event:any){
    console.log($event);
  }

/*
  async onSubmit($event) {
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
*/
}
