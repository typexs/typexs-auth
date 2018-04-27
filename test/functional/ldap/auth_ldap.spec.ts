import {suite, test} from "mocha-typescript";
import {Bootstrap, Container} from "typexs-base";
import * as _ from "lodash";
import {Auth} from "../../../src/middleware/Auth";
import {expect} from "chai";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {MockResponse} from "../../helper/MockResponse";
import {MockRequest} from "../../helper/MockRequest";
import {ILdapAuthOptions} from "../../../src/adapters/auth/ldap/ILdapAuthOptions";

let bootstrap: Bootstrap = null;

let auth: Auth = null;

let inc = 0;


const settingsTemplate = {
  storage:{
    default:{
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
}

@suite('functional/auth_ldap')
class AuthLdapSpec {

  static async before() {

  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }








  @test
  async 'do login by user search through admin bind'() {
    let settings = _.clone(settingsTemplate);
    settings.auth.methods.default = <ILdapAuthOptions>{
      type:'ldap',
      url: 'ldap.forumsys.com',
      bindDN: 'cn=read-only-admin,dc=example,dc=com',
      bindCredentials: 'password'
    };

    bootstrap = Bootstrap
      .setConfigSources([{type:'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    let res = new MockResponse();
    let req = new MockRequest();


    // user does not exists
    login = auth.getInstanceForLogin('default');
    login.username = 'riemann';
    login.password = 'password';


    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;


  }


}
