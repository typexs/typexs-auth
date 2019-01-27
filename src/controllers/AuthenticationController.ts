import {Body, CurrentUser, Get, JsonController, Post, Req, Res} from "routing-controllers";
import {Authorized} from "routing-controllers/decorator/Authorized";

import {Inject} from "@typexs/base";
import {ContextGroup, IRequest, IResponse} from "@typexs/server";
import {Auth} from "../middleware/Auth";

import {User} from "../entities/User";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";


@ContextGroup('api')
@JsonController()
export class AuthenticationController {

  @Inject(Auth.NAME)
  auth: Auth;

  @Get('/user/_config')
  config(): any {
    let methods = this.auth.getSupportedMethodsInfos();
    return {
      authKey: this.auth.getHttpAuthKey(),
      methods: methods
    };
  }

  @Get('/user/isAuthenticated')
  isAuthenticated(@Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.isAuthenticated(req);
  }


  @Post('/user/signup')
  register(@Body() signup: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AbstractUserSignup> {
    return this.auth.doSignup(signup, req, res).then(c => {
      c.applyState();
      return c.instance
    });
  }


  @Post('/user/login')
  login(@Body() login: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AbstractUserLogin> {
    return this.auth.doLogin(login, req, res).then(c => {
      c.applyState();
      return c.instance
    });
  }


  @Authorized()
  @Get('/user')
  async user(@CurrentUser({required: true}) user: User): Promise<User> {
    return user;
  }


  @Authorized()
  @Get('/user/logout')
  logout(@CurrentUser({required: true}) user: User, @Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.doLogout(user, req, res).then(e => {
      e.applyState();
      return e.instance
    });
  }


}
