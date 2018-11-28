import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Config, Container, Log} from "@typexs/base";
import * as _ from "lodash";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {LdapAdapter} from "../../../src/adapters/auth/ldap/LdapAdapter";
import {expect} from "chai";
import {TESTDB_SETTING, TestHelper} from "../TestHelper";
import {AuthDataContainer} from "../../../src/libs/auth/AuthDataContainer";
import {Auth} from "../../../src/middleware/Auth";
import {LDAP_CONFIG} from "./ldap_config";

let bootstrap: Bootstrap = null;


const settingsTemplate = {
  logging: {enable: true, level: 'debug'},
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    methods: {
      default: {
        type: 'ldap',
      }
    }
  }
};


@suite('functional/ldap/auth_ldap_adapter') @timeout(10000)
class Auth_ldap_adapterSpec {

  static async before() {

  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'authenticate by user search through admin bind'() {
    let settings = _.clone(settingsTemplate);
    settings.auth.methods.default = _.clone(LDAP_CONFIG);

    await TestHelper.bootstrap_basic(settings);

    let auth = Container.get(Auth);
    await auth.prepare();

    let adapter = Container.get(LdapAdapter);
    await adapter.prepare(Config.get('auth.methods.default'));

    Log.info('adapter ready');

    // success  login
    let login = new DefaultUserLogin();
    login.username = 'billy';
    login.password = 'password';
    let container = new AuthDataContainer(login);

    let success = await adapter.authenticate(container);
    Log.info(success, container);
    expect(success).to.be.true;


    // failed  login
    login = new DefaultUserLogin();
    login.username = 'billyy';
    login.password = 'password';
    container = new AuthDataContainer(login);

    success = await adapter.authenticate(container);
    Log.info(success, container);
    expect(success).to.be.false;

    // failed  login
    login = new DefaultUserLogin();
    login.username = 'billy';
    login.password = 'password2';
    container = new AuthDataContainer(login);

    success = await adapter.authenticate(container);
    Log.info(success, container);
    expect(success).to.be.false;

  }


}
