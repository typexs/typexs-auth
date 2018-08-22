import {IsEmail, MaxLength, MinLength} from "class-validator";
import {AbstractUserSignup} from "./AbstractUserSignup";
import {AllowedString} from "../validators/AllowedString";
import {EqualWith} from "typexs-ng/libs/validators/EqualWith";
import {Entity} from "typexs-schema/libs/decorators/Entity";
import {Property} from "typexs-schema/libs/decorators/Property";


@Entity(<any>{storeable: false})
export class DefaultUserSignup extends AbstractUserSignup {


  @MinLength(8, {message: "username is too short"})
  @MaxLength(32, {message: "username is too long"})
  @AllowedString(/^(\w|\d|_)+$/, {message: 'username contains wrongs chars'})
  @Property({type: 'string', form: 'text'})
  username: string;


  @MinLength(8, {message: "password is too short"})
  @MaxLength(64, {message: "password is a little too long"})
  @AllowedString(/^(\w|\d|_)+$/, {message: 'password contains wrongs chars'})
  @Property({type: 'string', form: 'password'})
  password: string;


  // HTML Type password confirmation
  @Property({type: 'string', form: 'password'})
  @EqualWith('password', {message: 'password is not equal'})
  passwordConfirm: string;

  // HTML5 Type email with additional help text
  @Property(<any>{type: 'string', form: 'email', help: 'We\'ll never share your email with anyone else.'})
  @IsEmail()
  mail: string;


  @Property({type: 'string', form: 'hidden'})
  authToken: string;

  resetSecret() {
    this.password = null;
  }


  getIdentifier() {
    return this.username;
  }

  getSecret() {
    return this.password;
  }

  getMail() {
    return this.mail;
  }
}
