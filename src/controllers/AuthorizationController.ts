import {Authorized, Body, CurrentUser, Get, JsonController, Post, Req, Res} from "routing-controllers";

import {Inject} from "@typexs/base";
import {ContextGroup, IRequest, IResponse} from "@typexs/server";
import {Auth} from "../middleware/Auth";

import {User} from "../entities/User";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";


@ContextGroup('api')
@JsonController()
export class AuthorizationController {

  @Inject("Auth")
  auth: Auth;


  // TODO get permissions / roles

  //
}
