import {IAuthAdapter} from "./IAuthAdapter";
import {AuthLifeCycle} from "../../types";
import {DefaultUserLogin} from "../models/DefaultUserLogin";
import {DefaultUserSignup} from "../models/DefaultUserSignup";
import {IAuthOptions} from "../auth/IAuthOptions";
import {AuthMethod} from "../../entities/AuthMethod";
import {IAuthData} from "./IAuthData";
import * as _ from "lodash";


export abstract class AbstractAuthAdapter implements IAuthAdapter {


  type: string = null;

  authId: string = null;

  options:IAuthOptions;



  abstract prepare(authOptions: IAuthOptions): void;

  abstract authenticate(login: any): Promise<boolean> | boolean;

  abstract extractAccessData(data:any):IAuthData;


  canCreateOnLogin(): boolean{
    return this.options && !_.isEmpty(this.options.createOnLogin) && this.options.createOnLogin;
  }

  canSignup(): boolean{
    return this.options && !_.isEmpty(this.options.allowSignup) && this.options.allowSignup && this['signup'];
  }

  getModelFor(lifecycle: AuthLifeCycle):Function {
    switch (lifecycle) {
      case "login":
        return DefaultUserLogin;
      case "signup":
        return DefaultUserSignup;
    }
    throw new Error("No model for lifecycle " + lifecycle + ' in ' + this.authId);
  }

}
