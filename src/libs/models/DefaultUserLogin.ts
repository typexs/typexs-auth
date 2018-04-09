import {AbstractUserLogin} from "./AbstractUserLogin";
import {AllowedString} from "../validators/AllowedString";
import {MinLength} from "class-validator";

export class DefaultUserLogin extends AbstractUserLogin {

  @MinLength(4,{message:'Username should be longer then 4 chars'})
  @AllowedString(/^(\w|\d|_)+$/,{message:'username contains wrongs chars'})
  username: string;

  @MinLength(4,{message:'Password should be longer then 4 chars'})
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
