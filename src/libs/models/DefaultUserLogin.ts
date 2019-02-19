import {AbstractUserLogin} from "./AbstractUserLogin";
import {AllowedString} from "../validators/AllowedString";
import {MinLength} from "class-validator";
import {Entity} from "@typexs/schema/libs/decorators/Entity";
import {Property} from "@typexs/schema/libs/decorators/Property";
import {ALLOWED_USER_PASSWORD_REGEX} from "../Constants";

import {FormType} from "@typexs/ng/libs/forms/decorators/FormType";
import {FormText} from "@typexs/ng/libs/forms/decorators/FormText";

@Entity(<any>{storeable: false})
export class DefaultUserLogin extends AbstractUserLogin {

  @FormText()
  @Property({type: 'string'})
  @MinLength(3, {message: 'Username should be longer then 4 chars'})
  @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'username contains wrong character'})
  username: string;

  @FormType({form:'password'})
  @Property({type: 'string'})
  @MinLength(3, {message: 'Password should be longer then 4 chars'})
  //@AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'password contains wrong character'})
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
