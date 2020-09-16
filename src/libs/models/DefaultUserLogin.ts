import {AbstractUserLogin} from './AbstractUserLogin';
import {AllowedString} from '../validators/AllowedString';
import {MinLength} from 'class-validator';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {ALLOWED_USER_PASSWORD_REGEX} from '../Constants';
import {Type} from '@typexs/ng/libs/forms/decorators/Type';
import {Text} from '@typexs/ng/libs/forms/decorators/Text';

@Entity(<any>{storeable: false})
export class DefaultUserLogin extends AbstractUserLogin {

  @Text()
  @Property({type: 'string'})
  @MinLength(3, {message: 'Username should be longer then 4 chars'})
  @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'username contains wrong character'})
  username: string;

  @Type({form: 'password'})
  @Property({type: 'string'})
  @MinLength(3, {message: 'Password should be longer then 4 chars'})
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
