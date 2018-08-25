import {IAuthOptions} from "../../../libs/auth/IAuthOptions";

export interface IOAuthOptions extends IAuthOptions {




  /**
   * ID of the client application
   */
  client_id: string;


  scopes: any;


  requestTokenURL?: string;

  accessTokenURL?: string;


  userAuthorizationURL?: string;

  consumerKey?: string;

  consumerSecret?: string;

  callbackURL?: string;


}
