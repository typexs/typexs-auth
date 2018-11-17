import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, StorageRef} from "@typexs/base";
import * as _ from "lodash";
import {Auth} from "../../../src/middleware/Auth";
import {expect} from "chai";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {MockResponse} from "../../helper/MockResponse";
import {MockRequest} from "../../helper/MockRequest";
import {ILdapAuthOptions} from "../../../src/adapters/auth/ldap/ILdapAuthOptions";

import {AuthMethod} from "../../../src/entities/AuthMethod";
import {AuthSession} from "../../../src/entities/AuthSession";
import {User} from "../../../src/entities/User";

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
        url: 'ldap://ldap.forumsys.com',
        bindDN: 'cn=read-only-admin,dc=example,dc=com',
        bindCredentials: 'password',
        searchBase: 'dc=example,dc=com'
      }
    }
  }
}

@suite('functional/auth_ldap_integrated')
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

    bootstrap = Bootstrap
      .setConfigSources([{type:'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    let ref:StorageRef = Container.get("storage.default");
    let c = await ref.connect();

    auth = Container.get(Auth);
    await auth.prepare();

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    let res = new MockResponse();
    let req = new MockRequest();



    // user doesn't exists and shouldn't be created if auth failed
    login = auth.getInstanceForLogin('default');
    login.username = 'riemann_not_da';
    login.password = 'password';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;


    let userList = await c.manager.find(User);
    let methodList = await c.manager.find(AuthMethod);
    let sessionList = await c.manager.find(AuthSession);
    console.log(userList,methodList,sessionList);
    expect(userList).to.have.length(0);


    // user exists and should be created if auth passed
    login = auth.getInstanceForLogin('default');
    login.username = 'riemann';
    login.password = 'password';

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.errors).to.be.null;


    userList = await c.manager.find(User);
    methodList = await c.manager.find(AuthMethod);
    sessionList = await c.manager.find(AuthSession,{relations:['user']});
    console.log(userList,methodList,sessionList);
    expect(userList).to.have.length(1);

  }


}
