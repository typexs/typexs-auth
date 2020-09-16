import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {User} from '../../entities/User';
import {UserAuthService} from './user-auth.service';
import {AuthService} from '@typexs/ng-base';


@Component({
  selector: 'user-profile',
  templateUrl: './user_profile.components.html',
})
export class UserProfileComponent implements OnInit {

  user: User;

  constructor(private authService: AuthService, private router: Router) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }

  async ngOnInit() {
    this.getUserAuthService().getUser().subscribe(user => {
      this.user = user;
    });
  }


  isAuthenticated() {
    return this.user && this.getUserAuthService().isLoggedIn();
  }

}
