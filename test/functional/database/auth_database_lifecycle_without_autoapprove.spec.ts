import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Container, Log, StorageRef} from "@typexs/base";
import {Auth} from "../../../src/middleware/Auth";
import {DefaultUserSignup} from "../../../src/libs/models/DefaultUserSignup";
import {expect} from "chai";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";
import {MockResponse} from "../../helper/MockResponse";
import {MockRequest} from "../../helper/MockRequest";
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";
import {TESTDB_SETTING, TestHelper} from "../TestHelper";
import {IDatabaseAuthOptions} from "../../../src/adapters/auth/db/IDatabaseAuthOptions";
import {User} from "../../../src/entities/User";
import {AuthMethod} from "../../../src/entities/AuthMethod";
import * as _ from 'lodash'
import {UserNotFoundError} from "../../../src/libs/exceptions/UserNotFoundError";

let bootstrap: Bootstrap = null;
let auth: Auth = null;
let inc = 0;

const OPTIONS = <ITypexsOptions>{
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    methods: {
      default: <IDatabaseAuthOptions>{
        type: 'database',
        allowSignup: true,
        approval: {
          auto: false
        }
      }
    }
  },
  logging: {
    enable: true,
    level: 'debug',
    transports: [{console: {name:'without_autoappr'}}]
  }
};

@suite('functional/auth_database_lifecycle_without_autoapproval') @timeout(20000)
class Auth_database_lifecycle_with_autoapproveSpec {


  static async before() {
    Log.self = null;
    Bootstrap.reset();
    bootstrap = await TestHelper.bootstrap_basic(OPTIONS);
    auth = Container.get(Auth);
    await auth.prepare();
  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
    Container.reset();
  }


  @test
  async 'lifecycle'() {
    let res = new MockResponse();
    let req = new MockRequest();

    const USERNAME = 'supermann3';
    const PASSWORD = 'password2';

    let signUp = auth.getInstanceForSignup<DefaultUserSignup>('default');
    signUp.username = USERNAME;
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = PASSWORD;
    signUp.passwordConfirm = PASSWORD;
    let doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.true;
    expect(doingSignup.isAuthenticated).to.be.false;

    let storageRef: StorageRef = Container.get('storage.default');
    let c = await storageRef.connect();
    let users = await c.manager.getRepository(User).find();

    let _user = users.shift();
    expect(_user).to.deep.include({
      username: signUp.getIdentifier(),
      mail: signUp.getMail(),
      disabled: "0",
      approved: "0"
    });


    let login = auth.getInstanceForLogin<DefaultUserLogin>('default');
    login.username = USERNAME;
    login.password = PASSWORD;
    let doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.hasErrors()).to.be.true;
    expect(_.get(doingLogin.errors,'0.constraints.user_is_not_approved')).to.exist;

    req = res;

    let user = await auth.getUserByRequest(req);
    try{
      await auth.doLogout(user, req, res);
      expect('shouldnt be here').to.be.true;
    }catch (e) {
      expect(e instanceof UserNotFoundError).to.be.true;
    }

    _user.approved = true;
    await c.manager.getRepository(User).save(_user);

    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.token).to.not.be.empty;
    expect(doingLogin.hasErrors()).to.be.false;

    req = res;


    // can't logout is not logged in!

    user = await auth.getUserByRequest(req);
    let doingLogout = await auth.doLogout(user, req, res);
    expect(doingLogout.success).to.be.true;
    expect(doingLogout.hasErrors()).to.be.false;

  }
}
