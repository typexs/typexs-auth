import {Component, OnInit} from '@angular/core';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import {AuthService} from "@typexs/ng-base";

@Component({
  selector: 'user-logout',
  templateUrl: './user_logout.components.html',
})
export class UserLogoutComponent implements OnInit {


  constructor(private auth: AuthService<UserAuthServiceProvider>, private router: Router) {

  }

  async ngOnInit() {
    let logout = this.auth.getProvider().newUserLogout();
    logout = <any>await this.auth.getProvider().logout(logout);

    if (logout.$state.success) {
      await this.router.navigateByUrl('/');
    } else {
      // TODO how to handle errors
      /*
      if (_.isArray(logout.$state.errors)) {
        this.validation.errors.messages.push({type: 'error', content: JSON.stringify(logout.errors)})
      } else {
        this.validation.errors.messages.push({type: 'error', content: 'UNKNOWN'})
      }
      this.validation.errors.valid = false;
      this.validation.errors.checked = true;
*/
    }
  }

  isAuthenticated() {
    return this.auth.getProvider().isAuthenticated();
  }


}
