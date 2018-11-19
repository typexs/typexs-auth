import {AbstractUserLogin} from "./AbstractUserLogin";
import {AllowedString} from "../validators/AllowedString";
import {MinLength} from "class-validator";
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {ALLOWED_USER_PASSWORD_REGEX} from "../Constants";


@Entity(<any>{storeable: false})
export class DefaultUserLogin extends AbstractUserLogin {

  @Property({type: 'string', form: 'text'})
  @MinLength(4, {message: 'Username should be longer then 4 chars'})
  @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'username contains wrongs chars'})
  username: string;

  @Property({type: 'string', form: 'password'})
  @MinLength(4, {message: 'Password should be longer then 4 chars'})
  @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'password contains wrongs chars'})
  password: string;


  resetSecret() {
    this.password = null;
  }

  getIdentifier() {
    return this.username;
  }

  getSecret() {
    return this.password;
  }
}
