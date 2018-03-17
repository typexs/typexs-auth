import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, ITypexsOptions, StorageRef} from "typexs-base";
import * as _ from "lodash";
import {Auth} from "../../src/middleware/Auth";
import {DefaultUserSignup} from "../../src/libs/models/DefaultUserSignup";
import {AuthUser} from "../../src/entities/AuthUser";
import {AuthMethod} from "../../src/entities/AuthMethod";
import {expect} from "chai";
import {DefaultUserLogin} from "../../src/libs/models/DefaultUserLogin";
import {MockResponse} from "../helper/MockResponse";
import {MockRequest} from "../helper/MockRequest";
import {AuthSession} from "../../src/entities/AuthSession";
import {Action} from "routing-controllers";

let bootstrap: Bootstrap = null;

let auth: Auth = null;

let inc = 0;

@suite('functional/auth_database')
class AuthConfigSpec {

  static async before() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
        auth: {
          methods: {
            default: {
              type: 'database',
              allowSignup: true
            }
          }
        }
      })
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();
  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'do signup'() {
    let doingSignup = null;
    let signUp: DefaultUserSignup = null;
    let res: any = {};
    let req: any = {};

    // too short username
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'superma';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'passWord2';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(1);
    expect(_.get(doingSignup.errors, '0.constraints.minLength')).to.exist;

    // too long username
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 's123456789123456789123456789123456789123456789123456789123456789';
    signUp.mail = `superman${inc++}@test.me`;;
    signUp.password = 'paSsword1';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(1);
    expect(_.get(doingSignup.errors, '0.constraints.maxLength')).to.exist;

    // wrong chars in username and password
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'su$perman';
    signUp.mail = `superman${inc++}@test.me`;;
    signUp.password = 'paSsw ord';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.false;
    expect(doingSignup.errors).to.have.length(2);
    expect(_.get(doingSignup.errors, '0.constraints.allowedString')).to.exist;
    expect(_.get(doingSignup.errors, '1.constraints.allowedString')).to.exist;

    // signup per db
    signUp = auth.getInstanceForSignup('default');
    signUp.username = 'superman';
    signUp.mail = `superman${inc++}@test.me`;;
    let pwd = signUp.password = 'password';
    doingSignup = await auth.doSignup(signUp, req, res);
    expect(doingSignup.success).to.be.true;
    expect(doingSignup.errors).to.have.length(0);

    let adapter = <any>auth.getAdapterByIdentifier("default");

    // TODO catch error signup not allowed

    let storageRef: StorageRef = Container.get('storage.default');
    let c = await storageRef.connect();
    let users = await c.manager.getRepository(AuthUser).find();
    let methods = await c.manager.getRepository(AuthMethod).find();


    // data correctly added
    let method = methods.shift();
    expect(method).to.deep.include({
      identifier: signUp.getIdentifier(),
      mail: signUp.getMail()
    });
    expect(await adapter.cryptCompare(pwd, method.secret)).to.be.true;

    let user = users.shift();
    expect(user).to.deep.include({
      username: signUp.getIdentifier(),
      mail: signUp.getMail()
    });

  }


  @test
  async 'do login'() {
    let doingLogin = null;
    let login: DefaultUserLogin = null;
    let res = new MockResponse();
    let req = new MockRequest();

    let signUp = auth.getInstanceForSignup('default');
    signUp.username = 'supermann';
    signUp.mail = `superman${inc++}@test.me`;;
    signUp.password = 'password2';
    await auth.doSignup(signUp, req, res);


    /*
    let storageRef: StorageRef = Container.get('storage.default');
    let c = await storageRef.connect();
    let users = await c.manager.getRepository(AuthUser).find();
    let methods = await c.manager.getRepository(AuthMethod).find();
    */


    // user does not exists
    login = auth.getInstanceForLogin('default');
    login.username = 'superma';
    login.password = 'passWord2';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;


    // content of username and password are wrong
    login = auth.getInstanceForLogin('default');
    login.username = 'super$man';
    login.password = 'pass$Word2';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(2);
    expect(_.get(doingLogin.errors, '0.constraints.allowedString')).to.exist;
    expect(_.get(doingLogin.errors, '1.constraints.allowedString')).to.exist;


    // user exists but password wrong
    login = auth.getInstanceForLogin('default');
    login.username = 'supermann';
    login.password = 'password';
    doingLogin = await auth.doLogin(login, req, res);
    expect(doingLogin.success).to.be.false;
    expect(doingLogin.isAuthenticated).to.be.false;
    expect(doingLogin.errors).to.have.length(1);
    expect(_.get(doingLogin.errors, '0.constraints.exists')).to.exist;


    // user exists and login
    login = auth.getInstanceForLogin('default');
    login.username = 'supermann';
    login.password = 'password2';
    doingLogin = await auth.doLogin(login, req, res);

    expect(doingLogin.success).to.be.true;
    expect(doingLogin.isAuthenticated).to.be.true;
    expect(doingLogin.user).to.be.not.empty;
    expect(doingLogin.user.id).to.be.greaterThan(0);
    expect(doingLogin.errors).to.be.null;

    let storageRef: StorageRef = Container.get('storage.default');
    let c = await storageRef.connect();
    let sessions = await c.manager.getRepository(AuthSession).find({relations: ["user"]});

    let session = sessions.shift();
    expect(session.token).to.be.eq(auth.getToken(res));
    expect(session.user.id).to.be.greaterThan(0);

  }


  @test
  async 'do get user data'() {
    let res = new MockResponse();
    let req = new MockRequest();

    let signUp = auth.getInstanceForSignup('default');
    signUp.username = 'testmann';
    signUp.mail = `superman${inc++}@test.me`;;
    signUp.password = 'password2';
    await auth.doSignup(signUp, req, res);

    let login = auth.getInstanceForLogin('default');
    login.username = 'testmann';
    login.password = 'password2';
    await auth.doLogin(login, req, res);
    req = res;

    let action:Action ={
      request:req,
      response:res,
      //context:null,
    };

    let isAuthenticated = await auth.authorizationChecker(action,[]);
    expect(isAuthenticated).to.be.true;

    let currentUser = await auth.getUserByRequest(req);
    expect(currentUser.id).to.be.greaterThan(0);
    expect(currentUser.username).to.be.eq("testmann");

    currentUser = await auth.currentUserChecker(action);
    expect(currentUser.id).to.be.greaterThan(0);
    expect(currentUser.username).to.be.eq("testmann");




  }

  @test
  async 'do logout'() {
    let res = new MockResponse();
    let req = new MockRequest();

    let signUp = auth.getInstanceForSignup('default');
    signUp.username = 'supermann';
    signUp.mail = `superman${inc++}@test.me`;;
    signUp.password = 'password2';
    await auth.doSignup(signUp, req, res);

    let login = auth.getInstanceForLogin('default');
    login.username = 'supermann';
    login.password = 'password2';
    await auth.doLogin(login, req, res);
    req = res;


    let req2 = new MockRequest();
    let res2 = new MockResponse();

    // empty header, no token found
    let logout = auth.getInstanceForLogout('default');
    let doingLogout = await auth.doLogout(logout, req2, res2);
    expect(doingLogout.success).to.be.false;
    expect(doingLogout.errors).to.have.length(1);
    expect(_.get(doingLogout.errors, '0.constraints.token_error')).to.exist;


    req2 = new MockRequest();
    req2.setHeader(auth.getHttpAuthKey(),'abcdy');
    res2 = new MockResponse();

    // no session found for token
    logout = auth.getInstanceForLogout('default');
    doingLogout = await auth.doLogout(logout, req2, res2);
    expect(doingLogout.success).to.be.false;
    expect(doingLogout.errors).to.have.length(1);
    expect(_.get(doingLogout.errors, '0.constraints.session_error')).to.exist;

    // normal logout
    let user = await auth.getUserByRequest(req);
    doingLogout = await auth.doLogout(user, req, res);
    expect(doingLogout.success).to.be.true;
    expect(doingLogout.errors).to.be.null;


  }

}

