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
import {TypeOrmConnectionWrapper} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';

const inc = 0;

let bootstrap: Bootstrap = null;
const settingsTemplate = {
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    methods: {
      default: LDAP_CONFIG
    }
  }
};

@suite('functional/auth_ldap_lifecycle')
class AuthLdapLifecycleSpec {

  static async before() {
    Bootstrap.reset();
    Config.clear();
  }


  static async after() {
    // await web.stop();
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'do login by user search through admin bind'() {
    const settings = _.clone(settingsTemplate);

    const refs = await TestHelper.bootstrap_auth('default', settings);
    bootstrap = refs.bootstrap;
    const auth = refs.auth;

    const ref: StorageRef = Injector.get('storage.default');
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    const req = new MockRequest();

    const adapter = auth.getAdapterByIdentifier('default');
    const options = adapter.getOptions();
    expect(options.approval.auto).to.be.true;

    // user doesn't exists and shouldn't be created if auth failed
    login = auth.getInstanceForLogin('default');
    login.username = 'billy_not_da';
    login.password = 'password';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;


    let userList = await c.manager.find(User);
    let methodList = await c.manager.find(AuthMethod);
    let sessionList = await c.manager.find(AuthSession);

    expect(userList).to.have.length(0);
    expect(sessionList).to.have.length(0);
    expect(methodList).to.have.length(0);


    // user exists and should be created if auth passed
    login = auth.getInstanceForLogin('default');
    login.username = 'billy';
    login.password = 'password';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.errors).to.be.empty;


    userList = await c.manager.find(User);
    methodList = await c.manager.find(AuthMethod);
    sessionList = await c.manager.find(AuthSession);
    // console.log(userList, methodList, sessionList);
    expect(userList).to.have.length(1);
    expect(sessionList).to.have.length(1);
    expect(methodList).to.have.length(1);

  }


}
