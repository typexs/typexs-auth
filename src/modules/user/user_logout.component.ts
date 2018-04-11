import {Component, OnInit} from '@angular/core';
import {AuthService} from "./auth.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';

@Component({
  selector: 'user-logout',
  templateUrl: './user_logout.components.html',
})
export class UserLogoutComponent implements OnInit {


  validation: { [key: string]: { valid: boolean, checked: boolean, messages: Array<{ type: string, content: string }> } } = {
    errors: {valid: false, checked: false, messages: []}
  };


  constructor(private auth: AuthService, private router: Router) {

  }

  async ngOnInit() {
    let logout = this.auth.newUserLogout();
    logout = <any>await this.auth.logout(logout);

    if (logout.success) {
      await this.router.navigateByUrl('/');
    } else {
      // TODO how to handle errors
      if (_.isArray(logout.errors)) {
        this.validation.errors.messages.push({type: 'error', content: JSON.stringify(logout.errors)})
      } else {
        this.validation.errors.messages.push({type: 'error', content: 'UNKNOWN'})
      }
      this.validation.errors.valid = false;
      this.validation.errors.checked = true;

    }
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }


}
