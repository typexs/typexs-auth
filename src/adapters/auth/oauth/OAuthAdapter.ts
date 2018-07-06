//import * as passport from "passport";
import * as _ from "lodash";
import {AuthMethod} from "../../../entities/AuthMethod";
import {DefaultUserLogin} from "../../../libs/models/DefaultUserLogin";
import {AbstractAuthAdapter} from "../../../libs/adapter/AbstractAuthAdapter";
import {AbstractInputData} from "../../../libs/models/AbstractInputData";
import {AuthUser} from "../../../entities/AuthUser";

import {Log, NestedException} from "typexs-base";
import {IOAuthOptions} from "./IOAuthOptions";

export const K_AUTH_OAUTH = 'oauth';


const DEFAULTS: IOAuthOptions = {

  type: K_AUTH_OAUTH,

  client_id: "MUST_BE_SET",

  scopes: []

};


export class OAuthAdapter extends AbstractAuthAdapter {


  type: string = K_AUTH_OAUTH;

  options: IOAuthOptions;

  hasRequirements() {
    // TODO check if database is enabled
    return true;
  }


  async prepare(opts: IOAuthOptions) {
    _.defaults(opts, DEFAULTS);
    super.prepare(opts);
  }


  async authenticate(login: DefaultUserLogin): Promise<boolean> {
    return login.isAuthenticated;

  }

  /*
  async signup(data: DefaultUserSignup) {
      // TODO impl method
      return false;
    }
  */


  createOnLogin(login: DefaultUserLogin): boolean {
    return true;
  }


  async extend(obj: AuthUser | AuthMethod, data: AbstractInputData): Promise<void> {

  }

}

