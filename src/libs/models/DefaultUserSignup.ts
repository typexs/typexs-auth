import {IsEmail, MaxLength, MinLength} from "class-validator";
import {DefaultUserLogin} from "./DefaultUserLogin";
import {AbstractUserSignup} from "./AbstractUserSignup";

export class DefaultUserSignup extends AbstractUserSignup {

  @MinLength(8, {
        message: "authId is too short"
  })
  @MaxLength(32, {
    message: "authId is too long"
  })
  username: string;

  @MinLength(8, {
    message: "password is too short"
  })
  @MaxLength(64, {
    message: "password is a little too long"
  })
  password:string;

  @IsEmail()
  mail: string;

  resetSecret(){
    this.password = null;
  }


}
