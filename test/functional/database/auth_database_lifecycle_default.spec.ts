process.env.LOG = '1';
import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Injector, StorageRef} from '@typexs/base';
import * as _ from 'lodash';
import {Auth} from '../../../src/middleware/Auth';
import {DefaultUserSignup} from '../../../src/libs/models/DefaultUserSignup';
import {AuthMethod} from '../../../src/entities/AuthMethod';
import {expect} from 'chai';
import {DefaultUserLogin} from '../../../src/libs/models/DefaultUserLogin';
import {MockResponse} from '../../helper/MockResponse';
import {MockRequest} from '../../helper/MockRequest';
import {AuthSession} from '../../../src/entities/AuthSession';
import {Action} from 'routing-controllers';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {User} from '../../../src/entities/User';
import {TESTDB_SETTING, TestHelper} from '../TestHelper';
import {AuthDataContainer} from '../../../src/libs/auth/AuthDataContainer';
import {LOGGING} from '../config';
import {TypeOrmConnectionWrapper} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';

let bootstrap: Bootstrap = null;
let auth: Auth = null;
let inc = 0;

const OPTIONS = <ITypexsOptions>{
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    methods: {
      default: {
        type: 'database',
        allowSignup: true
      }
    }
  },
  logging: LOGGING
};


@suite('functional/database/auth_database_lifecycle_default') @timeout(20000)
class AuthDatabaseLifecycleDefaultSpec {

  _beforeLoginDone: boolean = false;

  static async before() {
    bootstrap = await TestHelper.bootstrap_basic(OPTIONS);
    auth = Injector.get(Auth);
    await auth.prepare();
  }


  static async after() {
    // await web.stop();
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
    Injector.reset();
  }


  @test
  async 'do signup'() {
    let doingSignup: AuthDataContainer<DefaultUserSignup> = null;
    let signUp: DefaultUserSignup = null;
    const res: any = {};
    const req: any = {};

    // too short username
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'superma';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'passWord2';
    // signUp.passwordConfirm = 'passWord2';
    doingSignup = await auth.doSignup(signUp, req, res);

    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(2);
    expect(_.get(doingSignup.errors, '0.constraints.minLength')).to.exist;
    expect(_.get(doingSignup.errors, '1.constraints.equalWith')).to.exist;

    // too long username
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 's123456789123456789123456789123456789123456789123456789123456789';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'paSsword1';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(2);
    expect(_.get(doingSignup.errors, '0.constraints.maxLength')).to.exist;
    expect(_.get(doingSignup.errors, '1.constraints.equalWith')).to.exist;

    // wrong chars in username and password
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'su$perman';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'paSsw ord';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(1);
    // expect(_.get(doingSignup.errors, '0.constraints.allowedString')).to.exist;
    expect(_.get(doingSignup.errors, '0.constraints.equalWith')).to.exist;

    // signup per db
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'superman';
    signUp.mail = `superman${inc++}@test.me`;
    const pwd = signUp.password = 'password';
    signUp.passwordConfirm = 'password';

    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.true;
    expect(doingSignup.errors).to.have.length(0);

    const adapter = <any>auth.getAdapterByIdentifier('default');

    // TODO catch error signup not allowed

    const storageRef: StorageRef = Injector.get('storage.default');
    const c = await storageRef.connect() as TypeOrmConnectionWrapper;
    const users = await c.manager.getRepository(User).find();
    const methods = await c.manager.getRepository(AuthMethod).find();


    // data correctly added
    const method = methods.shift();
    expect(method).to.deep.include({
      identifier: signUp.getIdentifier(),
      mail: signUp.getMail()
    });
    expect(await adapter.cryptCompare(pwd, method.secret)).to.be.true;

    const user = users.shift();
    expect(user).to.deep.include({
      username: signUp.getIdentifier(),
      mail: signUp.getMail()
    });

    expect(user.isDisabled()).to.be.false;
    expect(user.isApproved()).to.be.true;


  }

  private async doLoginBefore() {
    if (this._beforeLoginDone) {
      return;
    }
    this._beforeLoginDone = true;

    const res = new MockResponse();
    const req = new MockRequest();

    const signUp = auth.getInstanceForSignup<DefaultUserSignup>('default');
    signUp.username = 'supermann';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'password2';
    signUp.passwordConfirm = 'password2';
    try {
      const doingSignup = await auth.doSignup(signUp, req, res);
    } catch (e) {
    }
    // expect(doingSignup.success).to.be.true;
  }


  @test
  async 'do login - user does not exists'() {
    await this.doLoginBefore();
    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    const req = new MockRequest();

    // user does not exists
    login = auth.getInstanceForLogin('default');
    login.username = 'superma';
    login.password = 'passWord2';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;
  }


  @test
  async 'do login - content of username and password are wrong'() {
    await this.doLoginBefore();
    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    const req = new MockRequest();

    // content of username and password are wrong
    login = auth.getInstanceForLogin('default');
    login.username = 'super$ man';
    login.password = 'pass$Wo# rd2';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.allowedString')).to.exist;
    // expect(_.get(doingLogin.errors, '1.constraints.allowedString')).to.exist;

  }

  @test
  async 'do login - user exists but password wrong'() {
    await this.doLoginBefore();
    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    const req = new MockRequest();

    // user exists but password wrong
    login = auth.getInstanceForLogin('default');
    login.username = 'supermann';
    login.password = 'password';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;
  }

  @test
  async 'do login - user exists and auto approved'() {
    await this.doLoginBefore();
    let doingLogin = null;
    let login: DefaultUserLogin = null;
    const res = new MockResponse();
    const req = new MockRequest();


    // user exists and auto approved
    login = auth.getInstanceForLogin('default');
    login.username = 'supermann';
    login.password = 'password2';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.user).to.not.be.empty;
    expect(doingLogin.hasErrors()).to.be.false;

    const storageRef: StorageRef = Injector.get('storage.default');
    const sessions = await storageRef.getController().find(AuthSession);
    expect(sessions).to.have.length.gte(1);

    const c = await storageRef.connect() as TypeOrmConnectionWrapper;
    const _session = await c.manager.getRepository(AuthSession)
      .findOne({where: {token: doingLogin.token}});


    const session = await storageRef.getController().findOne(AuthSession, {token: {$eq: doingLogin.token}}, {
      sort: {},
      limit: 1
    }) as AuthSession;
    expect(session).not.to.be.null;

    expect(session.token).to.be.eq(auth.getToken(res));
    // expect(session.user.id).to.be.greaterThan(0);

  }


  @test
  async 'do get user data'() {
    const res = new MockResponse();
    let req = new MockRequest();

    const signUp = auth.getInstanceForSignup<DefaultUserSignup>('default');
    signUp.username = 'testmann';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'password2';
    signUp.passwordConfirm = 'password2';
    const doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.true;

    const login = auth.getInstanceForLogin<DefaultUserLogin>('default');
    login.username = 'testmann';
    login.password = 'password2';
    const doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    req = res;

    const storageRef: StorageRef = Injector.get('storage.default');
    // const c = await storageRef.connect() as TypeOrmConnectionWrapper;
    // const session = await c.manager.getRepository(AuthSession)
    //   .findOne({where: {token: doingLogin.token}});
    const sessions = await storageRef.getController().find(AuthSession);
    // expect(session.token).to.be.eq(auth.getToken(res));


    const action: Action = {
      request: req,
      response: res
    };

    // console.log(action);

    const isAuthenticated = await auth.authorizationChecker(action, []);
    expect(isAuthenticated).to.be.true;
    // console.log(action);
    let currentUser = await auth.getUserByRequest(req);
    // console.log(currentUser);
    expect(currentUser.id).to.be.eq(doingLogin.user.id);
    expect(currentUser.id).to.be.greaterThan(0);
    expect(currentUser.username).to.be.eq('testmann');

    currentUser = await auth.currentUserChecker(action);
    expect(currentUser.id).to.be.greaterThan(0);
    expect(currentUser.username).to.be.eq('testmann');
  }


  @test
  async 'do logout'() {
    const res = new MockResponse();
    let req = new MockRequest();

    const USERNAME = 'supermann3';

    const signUp = auth.getInstanceForSignup<DefaultUserSignup>('default');
    signUp.username = USERNAME;
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'password2';
    signUp.passwordConfirm = 'password2';
    const doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.true;

    const login = auth.getInstanceForLogin<DefaultUserLogin>('default');
    login.username = USERNAME;
    login.password = 'password2';
    const doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.true;
    req = res;

    let req2 = new MockRequest();
    let res2 = new MockResponse();

    // empty header, no token found
    let user = new User();

    let doingLogout = await auth.doLogout(user, req2, res2);
    expect(doingLogout.success).to.be.false;
    expect(doingLogout.errors).to.have.length(1);
    expect(_.get(doingLogout.errors, '0.constraints.token_error')).to.exist;


    req2 = new MockRequest();
    req2.setHeader(auth.getHttpAuthKey(), 'abcdy');
    res2 = new MockResponse();

    // no session found for token
    user = new User();
    doingLogout = await auth.doLogout(user, req2, res2);
    expect(doingLogout.success).to.be.false;
    expect(doingLogout.errors).to.have.length(1);
    expect(_.get(doingLogout.errors, '0.constraints.session_error')).to.exist;

    // normal logout
    user = await auth.getUserByRequest(req);
    doingLogout = await auth.doLogout(user, req, res);
    expect(doingLogout.success).to.be.true;
    expect(doingLogout.hasErrors()).to.be.false;
  }

  @test.skip()
  async 'do unregister'() {

  }

  @test.skip()
  async 'do reset password'() {

  }
}
