import {Authorized, Body, CurrentUser, Get, JsonController, Post, Req, Res} from "routing-controllers";

import {Inject, StorageRef} from "typexs-base";
import {ContextGroup} from "typexs-server";
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
    return {
      authKey: this.auth.getHttpAuthKey()
    };
  }


  @Post('/user/signup')
  register(@Body() signup: any, @Req() req: Request, @Res() res: Response): Promise<IProcessData> {
    return this.auth.doSignup(signup, req, res);
  }


  @Post('/user/login')
  login(@Body() login: any, @Req() req: Request, @Res() res: Response): Promise<IProcessData> {
    return this.auth.doLogin(login, req, res);
  }


  @Authorized()
  @Get('/user')
  user(@CurrentUser({required: true}) user: AuthUser) {
    return user;
  }


  @Authorized()
  @Get('/user/logout')
  logout(@CurrentUser({required: true}) user: AuthUser, @Req() req: Request, @Res() res: Response) {
    return this.auth.doLogout(user, req, res);
  }

}
