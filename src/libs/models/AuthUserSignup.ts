import {IsEmail, MaxLength, MinLength} from "class-validator";

export class AuthUserSignup {

  identifier: string;

  @MinLength(8, {
        message: "username is too short"
  })
  @MaxLength(32, {
    message: "username is too long"
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

  errors: any = null;

  success:boolean = false;
}
