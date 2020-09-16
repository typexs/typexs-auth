import {suite, test} from '@testdeck/mocha';
import {Bootstrap, Config, Injector, StorageRef} from '@typexs/base';
import * as _ from 'lodash';
import {expect} from 'chai';
import {DefaultUserLogin} from '../../../src/libs/models/DefaultUserLogin';
import {MockResponse} from '../../helper/MockResponse';
import {MockRequest} from '../../helper/MockRequest';

import {AuthMethod} from '../../../src/entities/AuthMethod';
import {AuthSession} from '../../../src/entities/AuthSession';
import {User} from '../../../src/entities/User';
import {TESTDB_SETTING, TestHelper} from '../TestHelper';
import {LDAP_CONFIG} from './ldap_config';
import {IAuthConfig} from '../../../src/libs/auth/IAuthConfig';
import {IDatabaseAuthOptions} from '../../../src/adapters/auth/db/IDatabaseAuthOptions';
import {Auth} from '../../../src/middleware/Auth';
import {TypeOrmConnectionWrapper} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';


const settingsTemplate = {
  storage: {
    default: TESTDB_SETTING
  },
  initialise: {
    roles: [
      {role: 'admin', label: 'Administrator', permissions: ['*']}
    ],
    users: [
      {
        username: 'admin',
        password: 'admin123',
        adapter: 'database',
        mail: 'admin@local.txs',
      }
    ],

  },

  auth: <IAuthConfig>{
    chain: [
      'default',
      'database'
    ],
    methods: {
      default: LDAP_CONFIG,
      database: <IDatabaseAuthOptions>{
        type: 'database',
        allowSignup: true
      }
    }
  },
  logging: {
    enable: true,
    level: 'debug',
    transports: [{console: {name: 'ldap_then_database'}}]
  }
};
let bootstrap: Bootstrap = null;

@suite('functional/auth_ldap_then_database_lifecycle')
class AuthLdapLifecycleSpec {

  static async before() {
    Bootstrap.reset();
    Config.clear();
  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  async after() {
    // await web.stop();
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }

  }


  @test
  async 'do login by user search through admin bind'() {
    const settings = _.clone(settingsTemplate);

    bootstrap = await TestHelper.bootstrap_basic(settings);
    const auth = <Auth>Injector.get(Auth.NAME);
    await auth.prepare(settings.auth);

    const ref: StorageRef = Injector.get('storage.default');
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    let req = new MockRequest();

    let adapter = auth.getAdapterByIdentifier('default');
    let options = adapter.getOptions();
    expect(options.approval.auto).to.be.true;

    adapter = auth.getAdapterByIdentifier('database');
    options = adapter.getOptions();
    expect(options.approval.auto).to.be.true;

    let userList = await c.manager.getRepository(User).find();
    let methodList = await c.manager.getRepository(AuthMethod).find();
    expect(userList).to.have.length(1);
    expect(methodList).to.have.length(1);

    // ldap user doesn't exists and but exists in database
    login = auth.getInstanceForLogin('database');
    login.username = 'admin';
    login.password = 'admin123';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.hasErrors()).to.be.false;

    let sessionList = await c.manager.find(AuthSession);
    expect(sessionList).to.have.length(1);
    expect(_.first(sessionList)).to.deep.include({authId: 'database'});

    req = res;
    const doLogout = await auth.doLogout(doingLogin.user, req, res);

    sessionList = await c.manager.find(AuthSession);
    expect(sessionList).to.have.length(0);


    // user exists and should be created if auth passed
    login = auth.getInstanceForLogin('default');
    login.username = 'billy';
    login.password = 'password';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.hasErrors()).to.be.false;

    sessionList = await c.manager.find(AuthSession);
    expect(sessionList).to.have.length(1);
    expect(_.first(sessionList)).to.deep.include({authId: 'default'});

    req = res;
    await auth.doLogout(doingLogin.user, req, res);

    sessionList = await c.manager.find(AuthSession);
    expect(sessionList).to.have.length(0);

    userList = await c.manager.find(User);
    expect(_.map(userList, u => u.username)).to.be.deep.eq(['admin', 'billy']);
    methodList = await c.manager.find(AuthMethod);

//    console.log(userList, methodList, sessionList);
    expect(userList).to.have.length(2);
    expect(methodList).to.have.length(2);


  }


}
