import {suite, test} from "mocha-typescript";
import {Bootstrap, Config, Container, Log} from "@typexs/base";
import * as _ from "lodash";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {ILdapAuthOptions} from "../../../src/adapters/auth/ldap/ILdapAuthOptions";
import {LdapAdapter} from "../../../src/adapters/auth/ldap/LdapAdapter";
import {expect} from "chai";

let bootstrap: Bootstrap = null;


const settingsTemplate = {
  logging: {enable: true, level: 'debug'},
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:'
    }
  },
  auth: {
    methods: {
      default: {
        type: 'ldap',
      }
    }
  }
};

@suite('functional/auth_ldap')
class AuthLdapSpec {

  static async before() {

  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'authenticate by user search through admin bind'() {
    let settings = _.clone(settingsTemplate);
    settings.auth.methods.default = <ILdapAuthOptions>{
      type: 'ldap',
      url: 'ldap://ldap.forumsys.com:389',
      bindDN: 'cn=read-only-admin,dc=example,dc=com',
      bindCredentials: 'password',
      searchBase: 'dc=example,dc=com'
    };

    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    let adapter = Container.get(LdapAdapter);
    await adapter.prepare(Config.get('auth.methods.default'));

    // success  login
    let login = new DefaultUserLogin();
    login.username = 'riemann';
    login.password = 'password';

    let success = await adapter.authenticate(login);
    Log.info(success, login);
    expect(success).to.be.true;


    // failed  login
    login = new DefaultUserLogin();
    login.username = 'riemanner';
    login.password = 'password';

    success = await adapter.authenticate(login);
    Log.info(success, login);
    expect(success).to.be.false;

    // failed  login
    login = new DefaultUserLogin();
    login.username = 'riemann';
    login.password = 'password2';

    success = await adapter.authenticate(login);
    Log.info(success, login);
    expect(success).to.be.false;

  }


}
