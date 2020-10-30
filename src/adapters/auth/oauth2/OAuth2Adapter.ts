import * as _ from 'lodash';
import {DefaultUserLogin} from '../../../libs/models/DefaultUserLogin';
import {AbstractAuthAdapter} from '../../../libs/adapter/AbstractAuthAdapter';


import {Inject, Log} from '@typexs/base';
import {IOAuth2Options} from './IOAuth2Options';
import {IApplication, IRequest, IResponse} from '@typexs/server';
import {T_AUTH_ADAPTER_STAGE} from '../../../libs/adapter/IAuthAdapter';

import {IAuthConfiguration} from '../../../libs/adapter/IAuthConfiguration';
import {IAuthMethod} from '../../../libs/models/IAuthMethod';
import {Auth} from '../../../middleware/Auth';
import {AuthDataContainer} from '../../../libs/auth/AuthDataContainer';

export const K_AUTH_OAUTH2 = 'oauth2';


const DEFAULTS: IOAuth2Options = {

  type: K_AUTH_OAUTH2,


};


export class OAuth2Adapter extends AbstractAuthAdapter {

  static passport: any;

  static OAuth2Strategy: any;


  @Inject('Auth')
  auth: Auth;

  type: string = K_AUTH_OAUTH2;

  options: IOAuth2Options;

  strategy: any;

  configuration: IAuthConfiguration;


  hasRequirements() {
    try {
      OAuth2Adapter.passport = require('passport');
      OAuth2Adapter.OAuth2Strategy = require('passport-oauth2');
    } catch (e) {
      return false;
    }
    return true;
  }


  async prepare(opts: IOAuth2Options) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);

    if (this.options.configuration) {
      this.configuration = this.auth.getManager().getConfiguration(this.options.configuration);
      if (this.configuration) {
        this.configuration.configure(this.options);
      }
    }
    this.strategy = new OAuth2Adapter.OAuth2Strategy(this.options, this.onAuthentication.bind(this));
    this.strategy._oauth2.useAuthorizationHeaderforGET(true);
    OAuth2Adapter.passport.use(this.options.authId, this.strategy);
  }


  async onAuthentication(accessToken: any, refreshToken: any, profile: any, done: Function) {
    Log.info('OAuth2->onAuthentication ', 'Access: ' + accessToken, 'Refresh: ' + refreshToken, profile);
    let error = null;
    if (this.configuration) {
      try {
        profile = await this.configuration.onAuthentication(<any>this, accessToken, refreshToken, profile);
      } catch (e) {
        Log.error(e);
        error = e;
      }
    }

    done(error, profile, {accessToken: accessToken, refreshToken: refreshToken});

  }


  async authenticate(container: AuthDataContainer<DefaultUserLogin>): Promise<boolean> {
    Log.info('OAuth2->authenticate');
    return container.isAuthenticated;
  }


  use(app: IApplication, stage: T_AUTH_ADAPTER_STAGE) {
    if (stage === 'after') {
      app.use(OAuth2Adapter.passport.initialize());
      app.use(OAuth2Adapter.passport.session());
      const self = this;
      const authId = this.authId;

      (<any>app).get('/api/auth/' + authId,
        OAuth2Adapter.passport.authenticate(this.options.authId)
      );


      (<any>app).get('/api/auth/' + authId + '/callback',
        function (req: IRequest, res: IResponse, next: any) {
          Log.info('OAuth2->callback_init');
          OAuth2Adapter.passport.authenticate(authId, async (err: any, user: IAuthMethod, info: any) => {
            Log.info('OAuth2->callback ', err, user, info);

            if (err) {
              return next(err);
            }

            const login = new DefaultUserLogin();
            let container = new AuthDataContainer(login);
            login.username = user.identifier;
            login.password = 'XXXXXXXXXXXXXXX';
            login.authId = self.authId;
            container.data = user.data;
            (<any>container)._user = user;
            (<any>container)._info = info;

            container = <any>await self.auth.doAuthenticatedLogin(container, req, res);
            Log.info(container);

            // TODO add hasErrors
            if (container.hasErrors()) {
              return res.redirect('/user/login');
            }
            return res.redirect('/users/' + container.user.id);
          })(req, res, next);

        });

    }
  }


  createOnLogin(login: DefaultUserLogin): boolean {
    return true;
  }

  canCreateOnLogin() {
    return true;
  }

}

