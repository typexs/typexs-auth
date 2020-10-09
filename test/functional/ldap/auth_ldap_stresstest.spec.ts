import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Config, Injector, StorageRef} from '@typexs/base';
import * as _ from 'lodash';
import {getMetadataArgsStorage} from 'typeorm';
import {expect} from 'chai';
import {DefaultUserLogin} from '../../../src/libs/models/DefaultUserLogin';
import {MockResponse} from '../../helper/MockResponse';
import {MockRequest} from '../../helper/MockRequest';
import {User} from '../../../src/entities/User';
import {TestHelper} from '../TestHelper';
import {LDAP_CONFIG} from './ldap_config';
import {LOGGING} from '../config';
import {Role} from '@typexs/roles/entities/Role';
import {Permission, RBelongsTo} from '@typexs/roles';
import {AuthMethod, AuthSession} from '../../../src';

const inc = 0;


const settingsTemplate = {
  storage: {
    default: {
      synchronize: true,
      type: 'postgres',
      database: 'auth',
      username: 'auth',
      port: 5234,
      // logger: 'simple-console',
      // logging: 'all',

    }
  },
  auth: {
    methods: {
      default: LDAP_CONFIG
    }
  },
  logging: LOGGING
};
let bootstrap: Bootstrap = null;

@suite('functional/auth_ldap_stresstest') @timeout(60000)
class AuthLdapLifecycleSpec {

  static async before() {
    _.remove(getMetadataArgsStorage().tables, x => [
      User, Role, Permission, RBelongsTo, AuthSession, AuthMethod
    ].includes(x.target as any));
    _.remove(getMetadataArgsStorage().columns, x => [
      User, Role, Permission, RBelongsTo, AuthSession, AuthMethod
    ].includes(x.target as any));
    Bootstrap.reset();
    Config.clear();
  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
    _.remove(getMetadataArgsStorage().tables, x => [
      User, Role, Permission, RBelongsTo, AuthSession, AuthMethod
    ].includes(x.target as any));
    _.remove(getMetadataArgsStorage().columns, x => [
      User, Role, Permission, RBelongsTo, AuthSession, AuthMethod
    ].includes(x.target as any));
  }


  async after() {
    // await web.stop();
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'do 10 logins after an other'() {
    const settings = _.clone(settingsTemplate);
    // settings.logging.enable = true;
    // settings.auth.methods.default.timeout = 5000;
    // settings.auth.methods.default.idleTimeout = 50;
    const refs = await TestHelper.bootstrap_auth('default', settings);
    bootstrap = refs.bootstrap;
    const auth = refs.auth;

    const ref: StorageRef = Injector.get('storage.default');
    const c = await ref.connect();

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const r = _.range(0, 10);
    let auths = 0;
    for (const _r of r) {
      const res = new MockResponse();
      let req = new MockRequest();

      // user doesn't exists and shouldn't be created if auth failed
      login = auth.getInstanceForLogin('default');
      login.username = 'billy';
      login.password = 'password';

      doingLogin = await auth.doLogin(login, req, res);
      // tslint:disable-next-line:no-unused-expression
      expect(doingLogin.success).to.be.true;
      // tslint:disable-next-line:no-unused-expression
      expect(doingLogin.isAuthenticated).to.be.true;
      auths++;
      req = res;
      await auth.doLogout(doingLogin.user, req, res);

    }
    expect(auths).to.be.eq(10);


  }

  @test
  async 'do parallel logins'() {
    const settings = _.clone(settingsTemplate);
    // settings.logging.enable = true;
    // settings.auth.methods.default.idleTimeout = 50;
    // settings.auth.methods.default.timeout = 5000;

    const refs = await TestHelper.bootstrap_auth('default', settings);
    const auth = refs.auth;
    bootstrap = refs.bootstrap;


    const ref: StorageRef = Injector.get('storage.default');
    const c = await ref.connect();

    const names = ['billy', 'franz', 'herbert', 'neon', 'robert', 'sammy', 'lukas'];


    let auths = 0;
    const promises = [];
    for (const _r of names) {
      const res = new MockResponse();
      let req = new MockRequest();

      // user doesn't exists and shouldn't be created if auth failed
      const login: DefaultUserLogin = auth.getInstanceForLogin('default');
      login.username = _r;
      login.password = 'password';

      const p = auth.doLogin(login, req, res);
      p.then((l: any) => {

        // tslint:disable-next-line:no-unused-expression
        expect(l.success).to.be.true;
        // tslint:disable-next-line:no-unused-expression
        expect(l.isAuthenticated).to.be.true;
        req = res;
        auths++;
        return auth.doLogout(l.user, req, res);
      });
      promises.push(p);

    }
    await Promise.all(promises);


    expect(auths).to.be.eq(7);


  }


}
