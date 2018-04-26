
import {Authorized, Body, CurrentUser, Get, JsonController, Post, Req, Res} from "routing-controllers";

import {Inject, StorageRef} from "typexs-base";
import {ContextGroup, IRequest, IResponse} from "typexs-server";
import {Auth} from "../middleware/Auth";
import {AuthUser} from "../entities/AuthUser";
import {IProcessData} from "../libs/models/IProcessData";


@ContextGroup('api')
@JsonController()
export class AuthUserController {


  @Inject("storage.default")
  storage: StorageRef;


  @Inject("Auth")
  auth: Auth;

  @Get('/user/_config')
  config() {
    // TODO return more configuration data
    return {
      authKey: this.auth.getHttpAuthKey()
    };
  }

  @Get('/user/isAuthenticated')
  isAuthenticated(@Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.isAuthenticated(req);
  }


  @Post('/user/signup')
  register(@Body() signup: any, @Req() req: IRequest, @Res() res: IResponse): Promise<IProcessData> {
    return this.auth.doSignup(signup, req, res);
  }


  @Post('/user/login')
  login(@Body() login: any, @Req() req: IRequest, @Res() res: IResponse): Promise<IProcessData> {
    return this.auth.doLogin(login, req, res);
  }


  @Authorized()
  @Get('/user')
  user(@CurrentUser({required: true}) user: AuthUser): Promise<IProcessData> {
    return this.auth.getUserData(user);
  }


  @Authorized()
  @Get('/user/logout')
  logout(@CurrentUser({required: true}) user: AuthUser, @Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.doLogout(user, req, res);
  }

}
