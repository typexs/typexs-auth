import {IAuthOptions} from "../../../libs/auth/IAuthOptions";


export interface IDatabaseAuthOptions extends IAuthOptions {

  /*
  usernameField?: string;

  passwordField?: string;

  passReqToCallback?: boolean;

  badRequestMessage?: string;
*/

  saltRound?: number;

}
