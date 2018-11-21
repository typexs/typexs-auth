import {ILdapAuthOptions} from "../../../src/adapters/auth/ldap/ILdapAuthOptions";

export const LDAP_CONFIG: ILdapAuthOptions = <ILdapAuthOptions>{
  type: 'ldap',
  url: 'ldap://localhost:389',
  bindDN: 'cn=admin,dc=example,dc=org',
  bindCredentials: 'admin',
  searchBase: 'dc=example,dc=org'
};
