import {IsEmail, MaxLength, MinLength} from "class-validator";
import {AbstractUserSignup} from "./AbstractUserSignup";
import {AllowedString} from "../validators/AllowedString";


export class DefaultUserSignup extends AbstractUserSignup {


  @MinLength(8, {
        message: "authId is too short"
  })
  @MaxLength(32, {
    message: "authId is too long"
  })
  @AllowedString(/^(\w|\d|_)+$/,{message:'username contains wrongs chars'})
  username: string;


  @MinLength(8, {
    message: "password is too short"
  })
  @MaxLength(64, {
    message: "password is a little too long"
  })
  @AllowedString(/^(\w|\d|_)+$/,{message:'password contains wrongs chars'})
  password:string;

  @IsEmail()
  mail: string;

  resetSecret(){
    this.password = null;
  }


  getIdentifier(){
    return this.username;
  }

  getSecret(){
    return this.password;
  }

  getMail(){
    return this.mail;
  }
}
