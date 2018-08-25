import {IAuthOptions} from "../../../libs/auth/IAuthOptions";

export interface IOAuth2Options extends IAuthOptions {

  configuration?: string;

  authorizationURL?: string;

  tokenURL?: string;

  clientID?: string;

  clientSecret?: string;

  callbackURL?: string;

  scope?: string[];

}
