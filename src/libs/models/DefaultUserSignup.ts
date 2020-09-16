import {IsEmail, MaxLength, MinLength} from 'class-validator';
import {AbstractUserSignup} from './AbstractUserSignup';
import {AllowedString} from '../validators/AllowedString';
import {EqualWith} from '@typexs/ng/libs/validators/EqualWith';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {ALLOWED_USER_PASSWORD_REGEX} from '../Constants';
import {Type} from '@typexs/ng/libs/forms/decorators/Type';
import {Text} from '@typexs/ng/libs/forms/decorators/Text';

@Entity(<any>{storeable: false})
export class DefaultUserSignup extends AbstractUserSignup {


  @Text()
  @MinLength(8, {message: 'username is too short'})
  @MaxLength(32, {message: 'username is too long'})
  @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'username contains wrong character'})
  @Property({type: 'string'})
  username: string;


  @Type({form: 'password'})
  @MinLength(8, {message: 'password is too short'})
  @MaxLength(64, {message: 'password is a little too long'})
  // @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'password contains wrong character'})
  @Property({type: 'string'})
  password: string;


  // HTML Type password confirmation
  @Type({form: 'password'})
  @Property({type: 'string'})
  @EqualWith('password', {message: 'password is not equal'})
  passwordConfirm: string;


  @Type({form: 'email'})
  // HTML5 Type email with additional help text
  @Property(<any>{type: 'string', help: 'We\'ll never share your email with anyone else.'})
  @IsEmail()
  mail: string;

/*
  @Property({type: 'string', form: 'hidden'})
  authToken: string;
*/

  resetSecret() {
    this.password = null;
    this.passwordConfirm = null;
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
