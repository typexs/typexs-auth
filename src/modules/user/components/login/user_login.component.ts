import * as _ from 'lodash';
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DefaultUserLogin} from '../../../../libs/models/DefaultUserLogin';
import {Router} from '@angular/router';
import {UserAuthService} from './../../user-auth.service';
import {AuthService, IMessage, LogMessage, MessageChannel, MessageService, MessageType, NavigatorService} from '@typexs/ng-base';
import {mergeMap} from 'rxjs/operators';
import {Subscription} from 'rxjs';

@Component({
  selector: 'txs-user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit, OnDestroy {

  user: DefaultUserLogin;

  @Input()
  successUrl: string | any[] = 'user/profile';

  private logChannel: MessageChannel<LogMessage>;

  formMessage: MessageChannel<IMessage>;

  subscription: Subscription;

  authenticated: boolean;

  constructor(private authService: AuthService,
              private router: Router,
              private navigatorService: NavigatorService,
              private messageService: MessageService
  ) {

  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }


  ngOnInit() {
    // TODO must we wait here
    this.logChannel = this.messageService.getLogService();
    this.formMessage = this.messageService.get('form.user-login-form');
    this.user = this.getUserAuthService().newUserLogin();
    this.subscription = this.authService.isInitialized()
      .pipe(mergeMap(x => this.isAuthenticated()))
      .subscribe(async x => {
        this.authenticated = x;
        if (x && this.successUrl) {
          await this.redirectOnSuccess();
        }
      });
  }


  ngOnDestroy(): void {
    this.formMessage.finish();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  isAuthenticated() {
    return this.getUserAuthService().isLoggedIn();
  }

  redirectOnSuccess() {
    if (_.isString(this.successUrl)) {
      const nav = this.navigatorService.entries.find(e => e.path && e.path.includes(<string>this.successUrl));
      if (nav) {
        return this.router.navigate([nav.getFullPath()]);
      } else {
        return this.router.navigate([this.successUrl]);
      }
    } else if (_.isArray(this.successUrl)) {
      return this.router.navigate(this.successUrl);
    }
    return null;
  }


  onSubmit($event: any) {
    if ($event.data.isSuccessValidated) {
      this.getUserAuthService().authenticate(this.user).subscribe(user => {
          let state: any = null;
          if (user) {
            state = (user as any).$state;
            if (state && state.isAuthenticated) {
              // is login successfull
              this.redirectOnSuccess();
            } else {
              for (const error of state.errors) {
                _.keys(error.constraints).forEach(k => {
                  this.formMessage.publish({
                    type: <any>MessageType[error.type.toUpperCase()],
                    content: error.constraints[k],
                    topic: null
                  });
                });
              }
            }
          } else {
            throw new Error('No user object.');
          }
        },
        error => {
          this.logChannel.publish(LogMessage.error(error, this, 'onSubmit'));
        });
    }
  }

}
