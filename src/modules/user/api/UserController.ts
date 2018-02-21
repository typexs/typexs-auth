import {Get, JsonController, Param, QueryParam} from "routing-controllers";

import * as _ from 'lodash'
import moment = require("moment");
import {Storage, Inject} from "typexs-base";
import {ContextGroup} from "typexs-server";


@ContextGroup('api')
@JsonController()
export class UserController {


  @Inject()
  storage: Storage;


}
