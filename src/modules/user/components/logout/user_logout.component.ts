import {Component, Input, OnInit} from '@angular/core';

import {Router} from '@angular/router';
import {UserAuthService} from './../../user-auth.service';
import {AuthService} from '@typexs/ng-base';

@Component({
  selector: 'txs-user-logout',
  templateUrl: './user_logout.components.html',
})
export class UserLogoutComponent implements OnInit {

  @Input()
  successUrl: string = '/';

  constructor(private authService: AuthService, private router: Router) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }

  async ngOnInit() {
    const logout = this.getUserAuthService().newUserLogout();
    this.getUserAuthService().logout(logout).subscribe(async x => {
      if (x && x.$state.success) {
        // TODO logout redirect
        await this.router.navigateByUrl(this.successUrl);
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
    });

  }

  isAuthenticated() {
    return this.getUserAuthService().isLoggedIn();
  }


}
