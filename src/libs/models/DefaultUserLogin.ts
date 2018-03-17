import {AbstractUserLogin} from "./AbstractUserLogin";
import {AllowedString} from "../validators/AllowedString";

export class DefaultUserLogin extends AbstractUserLogin {

  @AllowedString(/^(\w|\d|_)+$/,{message:'username contains wrongs chars'})
  username: string;

  @AllowedString(/^(\w|\d|_)+$/,{message:'password contains wrongs chars'})
  password: string;

  resetSecret(){
    this.password = null;
  }

  getIdentifier(){
    return this.username;
  }

  getSecret(){
    return this.password;
  }
}
