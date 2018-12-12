import {ILdapAuthOptions} from "./ILdapAuthOptions";
import * as LdapAuth from "ldapauth-fork";


export class LdapAuthPromise {

  ldap: LdapAuth;

  user: any = {};

  success: boolean = false;

  error: Error | string = null;

  abort: number = 2000;

  constructor(options: ILdapAuthOptions) {
    this.ldap = new LdapAuth(options);
  }


  async authenticate(username: string, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.ldap.authenticate(username, password, (error: Error | string, result?: any) => {
        if (error) {
          this.error = error;
          reject(false)
        } else {
          this.user = result;
          this.success = true;
          resolve(true)
        }
      });
    });
  }


  async close() {
    return new Promise((resolve, reject) => {
      this.ldap.close((err: Error) => {
        reject(err);
      })
      resolve();
    });
  }

}
