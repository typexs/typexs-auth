import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {DefaultUserSignup} from '../../libs/models/DefaultUserSignup';
import {Router} from '@angular/router';
import {UserAuthService} from './user-auth.service';
import {AuthService, IMessage, LogMessage, MessageChannel, MessageService, MessageType, NavigatorService} from '@typexs/ng-base';
import * as _ from 'lodash';
import {Helper} from '@typexs/ng/browser';


@Component({
  selector: 'user-signup',
  templateUrl: './user_signup.component.html',
})
export class UserSignupComponent implements OnInit, OnDestroy {

  signup: DefaultUserSignup;


  @Input()
  successUrl: string | any[] = 'user/login';

  private logChannel: MessageChannel<LogMessage>;

  formMessage: MessageChannel<IMessage>;


  constructor(private authService: AuthService, private navigatorService: NavigatorService, private router: Router,
              private messageService: MessageService) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }


  ngOnInit() {
    // TODO check if signup supported
    // TODO must we wait here
    this.logChannel = this.messageService.getLogService();
    this.formMessage = this.messageService.get('form.user-signup-form');
    this.signup = this.getUserAuthService().newUserSignup();
    const init = this.authService.isInitialized();
    Helper.after(init as any, (x: boolean) => {
      if (x) {
        if (this.isAuthenticated()) {
          this.redirectOnSuccess();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.formMessage.finish();

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
        const data = await this.getUserAuthService().signup($event.data.instance);
        if (data.$state.success) {
          await this.redirectOnSuccess();
        } else {
          for (const error of data.$state.errors) {
            _.keys(error.constraints).forEach(k => {
              this.formMessage.publish({
                type: <any>MessageType[error.type.toUpperCase()],
                content: error.constraints[k],
                topic: null
              });
            });
          }
        }

      } catch (e) {
        this.logChannel.publish(LogMessage.error(e, this, 'onSubmit'));
      }
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
