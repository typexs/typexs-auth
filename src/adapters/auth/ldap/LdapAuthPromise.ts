import {ILdapAuthOptions} from "./ILdapAuthOptions";

import * as ldapjs from 'ldapjs';
import {SearchOptions} from 'ldapjs';
import {Log} from "@typexs/base";
import {EventEmitter} from 'events';
import * as _ from 'lodash';
import {ClientOptions} from "./LdapOptions";
import {UserNotFoundError} from "../../../libs/exceptions/UserNotFoundError";


export class LdapClient {

  name: string;

  options: ClientOptions;

  client: ldapjs.Client;

  connected: boolean = false;

  bound: boolean = false;

  lastError: Error = null;

  constructor(name: string, options: ClientOptions) {
    this.name = name;
    this.options = options;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {

      this.client = ldapjs.createClient(this.options);
      this.client.on('error', this.onError.bind(this));
      this.client.on('connectTimeout', this.onError.bind(this));
      this.client.on('connect', this.onConnect.bind(this));
      this.client.on('_connected', resolve);
      this.client.on('_errored', reject);
    });


  }


  bind(user: string, passowrd: string) {
    return new Promise((resolve, reject) => {
      if (this.bound) {
        resolve(this.bound);
      } else if (this.connected) {
        this.client.bind(user, passowrd, err => {
          if (err) {
            this.bound = false;
            this.lastError = err;
          } else {
            this.bound = true;

          }
          resolve(this.bound);
        })
      } else {
        reject(new Error('ldap client not connected'));
      }
    })
  }


  search(searchBase: string, options: SearchOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.bound) {
        reject(new Error('ldap not bound'))
      }
      this.client.search(searchBase, options, (err, res) => {
        if (err) {
          return reject(err);
        }

        let items: any[] = [];
        res.on('searchEntry', (entry) => {
          items.push(entry.object);
          /*
          if (this.options.includeRaw === true) {
            items[items.length - 1]._raw = entry.raw;
          }
          */
        });

        res.on('error', reject);

        res.on('end', function (result) {
          if (result.status !== 0) {
            const err = 'non-zero status from LDAP search: ' + result.status;
            reject(err);
          }
          resolve(items);
        });
      })

    });
  }

  onConnect() {
    this.connected = true;
    this.client.emit('_connected', this.connected)
  }


  onError(err: any) {
    Log.error('ldap client error ' + this.name, err);
    this.lastError = err;
    this.close();
    this.client.emit('_errored', err);
  }

  async close() {
    if (this.client) {
      if (this.connected) {

        this.client.unbind(err => {
          Log.error('ldap unbind', err);
        });
      }
    }
    this.bound = false;
    this.connected = false;
  }
}

export class LdapAuthPromise extends EventEmitter {

  //ldap: LdapAuth;

  options: ILdapAuthOptions;


  private clients: { [k: string]: LdapClient } = {};

  private adminBound: boolean = false;


  private userClient: ldapjs.Client;

  private userBound: boolean = false;


  constructor(options: ILdapAuthOptions) {
    super();
    _.defaults(options, {
      searchScope: 'sub',
      bindProperty: 'dn',
      groupSearchScope: 'sub',
      groupDnProperty: 'dn'
    });
    this.options = options;

    if (_.isEmpty(this.options.url)) {
      throw new Error('LDAP server URL is not defined.')
    }

    if (_.isEmpty(this.options.searchFilter)) {
      throw new Error('LDAP search filter is not defined.')
    }


    // we currently implement the admin variant throw admin
    //
    // this.ldap = new LdapAuth(options);
    // this.ldap.on('error', this.onError.bind(this));

    this.clients.admin = new LdapClient('admin', this.clientOptions);
    this.clients.user = new LdapClient('user', this.clientOptions);

  }


  get clientOptions() {
    return {
      url: this.options.url,
      tlsOptions: this.options.tlsOptions,
      socketPath: this.options.socketPath,
      log: this.options.log,
      timeout: this.options.timeout,
      connectTimeout: this.options.connectTimeout,
      idleTimeout: this.options.idleTimeout,
      reconnect: this.options.reconnect,
      strictDN: this.options.strictDN,
      queueSize: this.options.queueSize,
      queueTimeout: this.options.queueTimeout,
      queueDisable: this.options.queueDisable
    }
  }

  get bindDN() {
    return this.options.bindDN || (<any>this.options).bindDn || (<any>this.options).adminDn;
  }

  get bindCredentials() {
    return this.options.bindCredentials || (<any>this.options).Credentials || (<any>this.options).adminPassword;
  }

  async findUser(username: string, client: string = 'admin') {
    if (_.isEmpty(username)) {
      throw new Error('empty username')
    }

    const searchFilter = this.options.searchFilter.replace(/{{username}}/g, LdapAuthPromise.sanitizeInput(username));
    let opts: any = {filter: searchFilter, scope: this.options.searchScope};
    if (this.options.searchAttributes) {
      opts.attributes = this.options.searchAttributes;
    }

    let results = await this.clients[client].search(this.options.searchBase, opts)
    switch (results.length) {
      case 0:
        return null;
      case 1:
        return results[0];
      default:
        throw new Error('unexpected number of matches (' + results.length + ') for "' + username + '" username');
    }
  }

// TODO find groups


  static sanitizeInput(input: string) {
    return input
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\\/g, '\\5c')
      .replace(/\0/g, '\\00')
      .replace(/\//g, '\\2f');
  };


  async authenticate(username: string, password: string): Promise<any> {
    let user = null, result = null;
    if (_.isUndefined(password) || password === null || password === '') {
      throw new Error('no password given');
    }

    try {
      let connected = await this.clients.admin.connect();
      if (!connected) {
        throw new Error('ldap admin client can\'t connect')
      }


      let bound = await this.clients.admin.bind(this.bindDN, this.bindCredentials);
      if (!bound) {
        throw new Error('ldap can\'t bind');
      }

      user = await this.findUser(username);
      if (!user) {
        throw new UserNotFoundError(username);
      }

      connected = await this.clients.user.connect();
      if (!connected) {
        throw new Error('ldap admin user can\'t connect')
      }

      result = await this.clients.user.bind(user[this.options.bindProperty], password);
      // TODO on success read groups

    }catch (e) {
      throw e;
    } finally {
      await Promise.all([this.clients.user.close(), this.clients.admin.close()]);
    }
    return result ? user : null;
    /*
        return (new Promise<boolean>((resolve, reject) => {
          Log.debug('ldapauth: auth ...');
          this.ldap.authenticate(username, password, async (error: Error | string, result?: any) => {
            Log.debug('ldapauth: authenticate ' + username + ' error: ' + error);
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
            await this.close();
          });

        }))
        */
  }

  /*
    async close() {
      Log.debug('ldapauth: closeing ...');
      return new Promise((resolve, reject) => {

        if ((<any>this.ldap)._adminClient) {
          (<any>this.ldap)._adminClient.unbind((e: Error) => {
            Log.error(e)
          });
        }
        if ((<any>this.ldap)._userClient) {
          (<any>this.ldap)._userClient.unbind((e: Error) => {
            Log.error(e)
          });
        }
        Log.debug('ldapauth: close');
        resolve();
      });
    }
  */
}
