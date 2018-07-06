/**
 * Copy from ldapjs
 */


export type Scope = 'base' | 'one' | 'sub';


export interface GroupSearchFilterFunction {
  /**
   * Construct a group search filter from user object
   *
   * @param user The user retrieved and authenticated from LDAP
   */
  (user: any): string;
}


export interface Options extends ClientOptions {
  /**
   * Admin connection DN, e.g. uid=myapp,ou=users,dc=example,dc=org.
   * If not given at all, admin client is not bound. Giving empty
   * string may result in anonymous bind when allowed.
   *
   * Note: Not passed to ldapjs, it would bind automatically
   */
  bindDN?: string;
  /**
   * Password for bindDN
   */
  bindCredentials?: string;
  /**
   * The base DN from which to search for users by username.
   * E.g. ou=users,dc=example,dc=org
   */
  searchBase: string;
  /**
   * LDAP search filter with which to find a user by username, e.g.
   * (uid={{username}}). Use the literal {{username}} to have the
   * given username interpolated in for the LDAP search.
   */
  searchFilter: string;
  /**
   * Scope of the search. Default: 'sub'
   */
  searchScope?: Scope;
  /**
   * Array of attributes to fetch from LDAP server. Default: all
   */
  searchAttributes?: string[];

  /**
   * The base DN from which to search for groups. If defined,
   * also groupSearchFilter must be defined for the search to work.
   */
  groupSearchBase?: string;
  /**
   * LDAP search filter for groups. Place literal {{dn}} in the filter
   * to have it replaced by the property defined with `groupDnProperty`
   * of the found user object. Optionally you can also assign a
   * function instead. The found user is passed to the function and it
   * should return a valid search filter for the group search.
   */
  groupSearchFilter?: string | GroupSearchFilterFunction;
  /**
   * Scope of the search. Default: sub
   */
  groupSearchScope?: Scope;
  /**
   * Array of attributes to fetch from LDAP server. Default: all
   */
  groupSearchAttributes?: string[];

  /**
   * Property of the LDAP user object to use when binding to verify
   * the password. E.g. name, email. Default: dn
   */
  bindProperty?: string;
  /**
   * The property of user object to use in '{{dn}}' interpolation of
   * groupSearchFilter. Default: 'dn'
   */
  groupDnProperty?: string;

  /**
   * Set to true to add property '_raw' containing the original buffers
   * to the returned user object. Useful when you need to handle binary
   * attributes
   */
  includeRaw?: boolean;

  /**
   * If true, then up to 100 credentials at a time will be cached for
   * 5 minutes.
   */
  cache?: boolean;
}


export interface ClientOptions {
  url: string;
  tlsOptions?: Object;
  socketPath?: string;
  log?: any;
  timeout?: number;
  connectTimeout?: number;
  idleTimeout?: number;
  reconnect?: boolean | {
    initialDelay?: number,
    maxDelay?: number,
    failAfter?: number
  };
  strictDN?: boolean;
  queueSize?: number;
  queueTimeout?: number;
  queueDisable?: boolean;
  bindDN?: string;
  bindCredentials?: string;
}
