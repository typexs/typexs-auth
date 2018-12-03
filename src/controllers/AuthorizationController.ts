import {JsonController} from "routing-controllers";

import {Inject} from "@typexs/base";
import {ContextGroup} from "@typexs/server";
import {Auth} from "../middleware/Auth";


@ContextGroup('api')
@JsonController()
export class AuthorizationController {
/*
  @Inject("Auth")
  auth: Auth;
*/

  // TODO get permissions / roles

  //
}
