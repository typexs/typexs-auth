import {Authorized, Body, CurrentUser, Get, JsonController, Post, Req, Res} from "routing-controllers";

import {Inject} from "@typexs/base";
import {ContextGroup, IRequest, IResponse} from "@typexs/server";
import {Auth} from "../middleware/Auth";


import {User} from "../entities/User";
import {AuthDataContainer} from "../libs/auth/AuthDataContainer";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";


@ContextGroup('api')
@JsonController()
export class AuthenticationController {


  //@Inject("storage.default")
  //storage: StorageRef;


  @Inject("Auth")
  auth: Auth;

  @Get('/user/$config')
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
  register(@Body() signup: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AuthDataContainer<AbstractUserSignup>> {
    return this.auth.doSignup(signup, req, res);
  }


  @Post('/user/login')
  login(@Body() login: any, @Req() req: IRequest, @Res() res: IResponse): Promise<AuthDataContainer<AbstractUserLogin>> {
    return this.auth.doLogin(login, req, res);
  }


  @Authorized()
  @Get('/user')
  async user(@CurrentUser({required: true}) user: User): Promise<User> {
    return user;
  }


  @Authorized()
  @Get('/user/logout')
  logout(@CurrentUser({required: true}) user: User, @Req() req: IRequest, @Res() res: IResponse) {
    return this.auth.doLogout(user, req, res);
  }


  /*
  @UseBefore((request: any, response: any, next: Function) => {
15	        console.log("wow middleware");
16	        next();
17	    })

  @Get('/auth/:authId/callback')
  callback(@Param('authId') authId: string, @Req() req: IRequest, @Res() res: IResponse) {
    Log.info('Controller->callback ');
    let adapter = this.auth.getAdapterByIdentifier(authId);
    if (adapter.handleCallback) {
      return adapter.handleCallback(req, res);
    } else {
      return {'error': 404}
    }
  }


  @Get('/auth/:authId')
  redirect(@Param('authId') authId: string, @Req() req: IRequest, @Res() res: IResponse) {
    Log.info('Controller->redirect');
    let adapter = this.auth.getAdapterByIdentifier(authId);
    if (adapter.handleRedirect) {
       let _next = adapter.handleRedirect(req, res);
       Log.info('',_next);
       // return _next;
    } else {
      return {'error': 404}
    }
  }
*/
}
