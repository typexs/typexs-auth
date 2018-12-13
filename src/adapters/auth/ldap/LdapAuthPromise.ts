import {ILdapAuthOptions} from "./ILdapAuthOptions";
import * as LdapAuth from "ldapauth-fork";
import {Log} from "@typexs/base";


export class LdapAuthPromise {

  ldap: LdapAuth;

  constructor(options: ILdapAuthOptions) {
    this.ldap = new LdapAuth(options);
    this.ldap.on('error', this.onError.bind(this));
  }

  onError(err:any){
    Log.error('LDAP ERROR',err);
  }


  async authenticate(username: string, password: string): Promise<any> {
    return new Promise<boolean>((resolve, reject) => {
      this.ldap.authenticate(username, password, (error: Error | string, result?: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }

        this.ldap.close()
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
