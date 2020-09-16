import * as _ from 'lodash';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DefaultUserLogin} from '../../libs/models/DefaultUserLogin';
import {Router} from '@angular/router';
import {UserAuthService} from './user-auth.service';
import {AuthService, IMessage, LogMessage, MessageChannel, MessageService, MessageType, NavigatorService} from '@typexs/ng-base';
import {mergeMap} from 'rxjs/operators';

@Component({
  selector: 'user-login',
  templateUrl: './user_login.component.html',
})
export class UserLoginComponent implements OnInit, OnDestroy {

  user: DefaultUserLogin;

  @Input()
  successUrl: string | any[] = 'user/profile';

  private logChannel: MessageChannel<LogMessage>;

  formMessage: MessageChannel<IMessage>;


  constructor(private authService: AuthService,
              private router: Router,
              private navigatorService: NavigatorService,
              private messageService: MessageService) {

  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }


  ngOnInit() {
    // TODO must we wait here
    this.logChannel = this.messageService.getLogService();
    this.formMessage = this.messageService.get('form.user-login-form');
    this.user = this.getUserAuthService().newUserLogin();
    const sub = this.authService.isInitialized()
      .pipe(mergeMap(x => this.isAuthenticated()))
      .subscribe(async x => {
        if (x) {
          await this.redirectOnSuccess();
        }
        sub.unsubscribe();
      });


  }

  ngOnDestroy(): void {
    this.formMessage.finish();
    // this.logChannel.finish();
  }


  isAuthenticated() {
    return this.getUserAuthService().isLoggedIn();
  }

  async redirectOnSuccess() {
    if (_.isString(this.successUrl)) {
      const nav = this.navigatorService.entries.find(e => e.path && e.path.includes(<string>this.successUrl));
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
        const user = await this.getUserAuthService().authenticate(this.user);
        let state: any = null;
        if (user) {
          state = (user as any).$state;
          if (state && state.isAuthenticated) {
            // is login successfull
            await this.redirectOnSuccess();
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
        // TODO navigate to the preferred startup state
      } catch (e) {
        this.logChannel.publish(LogMessage.error(e, this, 'onSubmit'));
      }
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
