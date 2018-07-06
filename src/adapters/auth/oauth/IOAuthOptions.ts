import {IAuthOptions} from "../../../libs/auth/IAuthOptions";

export interface IOAuthOptions extends IAuthOptions {




  /**
   * ID of the client application
   */
  client_id: string;


  scopes: any;

}
