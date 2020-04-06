import {Body, ContentType, CurrentUser, Get, JsonController, Post, Req, Res} from 'routing-controllers';
import {Authorized} from 'routing-controllers/decorator/Authorized';

import {Inject} from '@typexs/base';
import {ContextGroup, IRequest, IResponse} from '@typexs/server';
import {Auth} from '../middleware/Auth';

import {User} from '../entities/User';
import {AbstractUserSignup} from '../libs/models/AbstractUserSignup';
import {AbstractUserLogin} from '../libs/models/AbstractUserLogin';
import {IAuthSettings} from '../libs/auth/IAuthSettings';
import {
  _API_USER_CONFIG,
  _API_USER_IS_AUTHENTICATED,
  _API_USER_LOGIN,
  _API_USER_LOGOUT,
  _API_USER_SIGNUP,
  API_USER
} from '../libs/Constants';


@ContextGroup('api')
@JsonController(API_USER)
export class AuthenticationController {

  @Inject(Auth.NAME)
  auth: Auth;


  @Get(_API_USER_CONFIG)
  @ContentType('application/json')
  config(): IAuthSettings {
    const methods = this.auth.getSupportedMethodsInfos();
    return {
      enabled: this.auth.isEnabled(),
      authKey: this.auth.getHttpAuthKey(),
      methods: methods
    };
  }


  @Get(_API_USER_IS_AUTHENTICATED)
  @ContentType('application/json')
  isAuthenticated(@Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.isAuthenticated(req);
  }


  @Post(_API_USER_SIGNUP)
  @ContentType('application/json')
  register(@Body() signup: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AbstractUserSignup> {
    return this.auth.doSignup(signup, req, res).then(c => {
      c.applyState();
      return c.instance;
    });
  }


  @Post(_API_USER_LOGIN)
  @ContentType('application/json')
  login(@Body() login: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AbstractUserLogin> {
    return this.auth.doLogin(login, req, res).then(c => {
      c.applyState();
      return c.instance;
    });
  }


  @Authorized()
  @Get()
  @ContentType('application/json')
  async user(@CurrentUser({required: true}) user: User): Promise<User> {
    return user;
  }


  @Authorized()
  @Get(_API_USER_LOGOUT)
  @ContentType('application/json')
  logout(@CurrentUser({required: true}) user: User, @Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.doLogout(user, req, res).then(e => {
      e.applyState();
      return e.instance;
    });
  }


}
