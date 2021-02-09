import * as _ from 'lodash';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {User} from '../../../../entities/User';
import {UserAuthService} from './../../user-auth.service';
import {AuthService} from '@typexs/ng-base';
import {mergeMap} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {of} from 'rxjs/internal/observable/of';


@Component({
  selector: 'txs-user-profile',
  templateUrl: './user_profile.components.html',
})
export class UserProfileComponent implements OnInit, OnDestroy {

  user: User;

  private subscription: Subscription;

  constructor(private authService: AuthService, private router: Router) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }

  async ngOnInit() {
    this.subscription = this.getUserAuthService().isInitialized()
      .pipe(mergeMap(x => this.getUserAuthService().isLoggedIn()))
      .pipe(mergeMap(x => x ? this.getUserAuthService().getUser() : of(null)))
      .subscribe(x => {
        this.user = x;
        if (_.isNull(x)) {
          this.router.navigateByUrl('/');
        }
      });
  }


  isAuthenticated() {
    return this.user && this.getUserAuthService().isLoggedIn();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
