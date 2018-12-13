import {suite, test,timeout} from "mocha-typescript";
import {Bootstrap, Config, Container, StorageRef} from "@typexs/base";
import * as _ from "lodash";
import {PlatformTools} from 'typeorm/platform/PlatformTools';
import {getMetadataArgsStorage} from 'typeorm';
import {expect} from "chai";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {MockResponse} from "../../helper/MockResponse";
import {MockRequest} from "../../helper/MockRequest";

import {AuthMethod} from "../../../src/entities/AuthMethod";
import {AuthSession} from "../../../src/entities/AuthSession";
import {User} from "../../../src/entities/User";
import {TESTDB_SETTING, TestHelper} from "../TestHelper";
import {LDAP_CONFIG} from "./ldap_config";
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";
import {LOGGING} from "../config";
import {Helper} from "@typexs/server";
import {Role} from "../../../src/entities/Role";
import {Permission} from "../../../src/entities/Permission";
import {RBelongsTo} from "../../../src/entities/RBelongsTo";

let inc = 0;


const settingsTemplate = {
  storage: {
    default: {
      synchronize: true,
      type: 'postgres',
      database: 'auth',
      username: 'auth',
      port: 5234

    }
  },
  auth: {
    methods: {
      default: LDAP_CONFIG
    }
  },
  logging: LOGGING
};

@suite('functional/auth_ldap_stresstest') @timeout(60000)
class Auth_ldap_lifecycleSpec {

  static async before() {
    _.remove(getMetadataArgsStorage().tables,x => x.target == User)
    _.remove(getMetadataArgsStorage().columns,x => x.target == User)
    _.remove(getMetadataArgsStorage().tables,x => x.target == Role)
    _.remove(getMetadataArgsStorage().columns,x => x.target == Role)
    _.remove(getMetadataArgsStorage().tables,x => x.target == Permission)
    _.remove(getMetadataArgsStorage().columns,x => x.target == Permission)
    _.remove(getMetadataArgsStorage().tables,x => x.target == RBelongsTo)
    _.remove(getMetadataArgsStorage().columns,x => x.target == RBelongsTo)
    Bootstrap.reset();
    Config.clear();
  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'do 50 logins after an other'() {
    let settings = _.clone(settingsTemplate);
    settings.logging.enable = true;
    //settings.auth.methods.default.timeout = 5000;
    //settings.auth.methods.default.idleTimeout = 50;
    let refs = await TestHelper.bootstrap_auth('default', settings);
    let auth = refs.auth;

    let ref: StorageRef = Container.get('storage.default');
    let c = await ref.connect();

    let doingLogin = null;
    let login: DefaultUserLogin = null;
    let r = _.range(0, 50);
    let auths = 0;
    for (let _r of r) {
      let res = new MockResponse();
      let req = new MockRequest();

      // user doesn't exists and shouldn't be created if auth failed
      login = auth.getInstanceForLogin('default');
      login.username = 'billy';
      login.password = 'password';

      doingLogin = await auth.doLogin(login, req, res);
      expect(doingLogin.success).to.be.true;
      expect(doingLogin.isAuthenticated).to.be.true;
      auths++;
      req = res;
      await auth.doLogout(doingLogin.user, req, res);

    }
    expect(auths).to.be.eq(50);


  }

  @test
  async 'do parallel logins'() {
    let settings = _.clone(settingsTemplate);
    settings.logging.enable = true;
    //settings.auth.methods.default.idleTimeout = 50;
    settings.auth.methods.default.timeout = 5000;

    let refs = await TestHelper.bootstrap_auth('default', settings);
    let auth = refs.auth;

    let ref: StorageRef = Container.get('storage.default');
    let c = await ref.connect();

    let names = ['billy', 'franz', 'herbert', 'neon', 'robert', 'sammy', 'lukas'];


    let auths = 0;
    let promises = [];
    for (let _r of names) {
      let res = new MockResponse();
      let req = new MockRequest();

      // user doesn't exists and shouldn't be created if auth failed
      console.log('try '+_r)
      let login: DefaultUserLogin = auth.getInstanceForLogin('default');
      login.username = _r;
      login.password = 'password';

      let p = auth.doLogin(login, req, res);
      p.then((l) => {

        expect(l.success).to.be.true;
        expect(l.isAuthenticated).to.be.true;
        req = res;
        auths++;
        return auth.doLogout(l.user, req, res);
      });
      promises.push(p);

    }
    await Promise.all(promises);
    console.log('dome')


    expect(auths).to.be.eq(7);


  }


}
