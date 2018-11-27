import {Component, OnInit} from '@angular/core';

import {DefaultUserLogin} from "../../libs/models/DefaultUserLogin";
import {Router} from "@angular/router";
import {UserAuthService} from "./user-auth.service";
import {AuthService, NavigatorService} from "@typexs/ng-base";
import {User} from "../../entities/User";


@Component({
  selector: 'user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit {

  auth_token: string;

  user: DefaultUserLogin;


  constructor(private authService: AuthService, private router: Router,private navigatorService: NavigatorService) {

  }

  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }

  ngOnInit() {
    // TODO must we wait here
    this.user = this.getUserAuthService().newUserLogin();
  }


  async onSubmit($event: any) {
    console.log($event);
    if($event.data.isSuccessValidated){

      try{
        let user = await this.getUserAuthService().authenticate(this.user);
        if (user.$state.isAuthenticated) {
          // is login successfull
          let nav = this.navigatorService.entries.find(e => e.path == 'user/profile');
          await this.router.navigateByUrl(nav.getRealPath());
        } else {
          // TODO pass errors to form
          console.error(user.$state)
        }
        // TODO navigate to the preferred startup state
      }catch(e){
        console.error(e);
      }

    }else{
      console.error($event);
    }
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
