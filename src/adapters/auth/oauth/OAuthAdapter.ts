import * as _ from 'lodash';
import {DefaultUserLogin} from '../../../libs/models/DefaultUserLogin';
import {AbstractAuthAdapter} from '../../../libs/adapter/AbstractAuthAdapter';
import {Log} from '@typexs/base';
import {IOAuthOptions} from './IOAuthOptions';
import {IApplication} from '@typexs/server';
import {T_AUTH_ADAPTER_STAGE} from '../../../libs/adapter/IAuthAdapter';
import {AuthDataContainer} from '../../../libs/auth/AuthDataContainer';

export const K_AUTH_OAUTH = 'oauth';


const DEFAULTS: IOAuthOptions = {

  type: K_AUTH_OAUTH,

  client_id: 'MUST_BE_SET',

  scopes: []

};


export class OAuthAdapter extends AbstractAuthAdapter {

  static passport: any;

  static OAuthStrategy: any;


  type: string = K_AUTH_OAUTH;

  options: IOAuthOptions;

  passport: any;

  oauthStrategy: any;


  hasRequirements() {
    try {
      OAuthAdapter.passport = require('passport');
      OAuthAdapter.OAuthStrategy = require('passport-oauth').OAuthStrategy;
    } catch (e) {
      Log.warn('OAuth adapter necassary modules "passport" or "passport-oauth" are missing. Skip loading.');
      return false;
    }
    return true;
  }


  async prepare(opts: IOAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);

    const passport = OAuthAdapter.passport;
    const OAuthStrategy = OAuthAdapter.OAuthStrategy;

    passport.use(this.options.authId, new OAuthStrategy(this.options, this.onAuthentication.bind(this)));
  }


  onAuthentication(token: any, tokenSecret: any, profile: any, done: Function) {
    Log.info('OAuth->onAuthentication ', token, tokenSecret, profile);
    done();
  }

  async authenticate(container: AuthDataContainer<DefaultUserLogin>): Promise<boolean> {
    return container.isAuthenticated;
  }

  /*
  async signup(data: DefaultUserSignup) {
      // TODO impl method
      return false;
    }
  */

  use(app: IApplication, stage: T_AUTH_ADAPTER_STAGE) {
    if (stage == 'after') {

    }
  }


  createOnLogin(login: DefaultUserLogin): boolean {
    return true;
  }


}
