import {Get, JsonController, Param, QueryParam} from "routing-controllers";

import {Storage, Inject} from "typexs-base";
import {ContextGroup} from "typexs-server";


@ContextGroup('api')
@JsonController()
export class UserController {


  @Inject()
  storage: Storage;


}
