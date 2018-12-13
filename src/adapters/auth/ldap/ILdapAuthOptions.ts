import {IAuthOptions} from "../../../libs/auth/IAuthOptions";
import {Options} from "./LdapOptions";



export interface ILdapAuthOptions extends IAuthOptions, Options {

  url: string;

  /**
   * Attribute name for email adresses
   */
  mailAttr?: string;

  /**
   * Attribute name for fullname
   */
  fullNameAttr?: string;

  /**
   * Attribute name for uid
   */
  // uidAttr: string; is same bindProperty

}
