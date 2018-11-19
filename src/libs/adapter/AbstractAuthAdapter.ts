import {IAuthAdapter} from "./IAuthAdapter";
import {AuthLifeCycle} from "../../types";
import {DefaultUserLogin} from "../models/DefaultUserLogin";
import {DefaultUserSignup} from "../models/DefaultUserSignup";
import {IAuthOptions} from "../auth/IAuthOptions";
import {AuthMethod} from "../../entities/AuthMethod";

import * as _ from "lodash";


import {DefaultUserLogout} from "../models/DefaultUserLogout";
import {User} from "../../entities/User";


export abstract class AbstractAuthAdapter implements IAuthAdapter {


  type: string = null;

  authId: string = null;

  options: IAuthOptions;


  prepare(authOptions: IAuthOptions): void {
    this.options = authOptions;
  }


  abstract authenticate(login: any): Promise<boolean> | boolean;


  extend(obj: User | AuthMethod, data: any): void {
  }


  canCreateOnLogin(): boolean {
    return _.get(this.options, 'createOnLogin', false) && _.isFunction(this['createOnLogin']);
  }


  canSignup(): boolean {
    let res = _.get(this.options, 'allowSignup', false) && _.isFunction(this['signup']);
    return res;
  }


  getModelFor(lifecycle: AuthLifeCycle): Function {
    switch (lifecycle) {
      case "login":
        return DefaultUserLogin;
      case "signup":
        return DefaultUserSignup;
      case "logout":
        return DefaultUserLogout;
    }
    throw new Error("No model for lifecycle " + lifecycle + ' in ' + this.authId);
  }

}
