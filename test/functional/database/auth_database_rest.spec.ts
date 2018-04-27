import {suite, test} from "mocha-typescript";

import {expect} from 'chai';
import * as request from 'supertest';

import {K_ROUTE_CONTROLLER, WebServer} from "typexs-server";
import {Bootstrap, Container, ITypexsOptions} from "typexs-base";

import {Auth} from "../../../src/middleware/Auth";
import {DefaultUserSignup} from "../../../src/libs/models/DefaultUserSignup";
import {DefaultUserLogin} from "../../../src/libs/models/DefaultUserLogin";

let inc = 0;
let bootstrap: Bootstrap = null;
let web: WebServer = null;

@suite('functional/auth_database_rest')
class AuthConfigSpec {

  static async before() {
    bootstrap = Bootstrap.setConfigSources([{type: 'system'}])
      .configure(<ITypexsOptions>{
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
              type: 'database'
            }
          }
        }
      })
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    web = Container.get(WebServer);
    await web.initialize({
      type: 'web',
      framework: 'express',
      routes: [{
        type: K_ROUTE_CONTROLLER,
        routePrefix: 'api',
        context: 'api'
      }]
    });

    await web.prepare();
    let uri = web.getUri();
    let routes = web.getRoutes();

    await web.start();

  }

  static async after() {
    await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'signup'() {
    let auth = <Auth>Container.get("Auth");
    let signUp: DefaultUserSignup = auth.getInstanceForSignup();
    signUp.username = 'superman';
    signUp.mail = `superman${inc++}@test.me`;
    signUp.password = 'password';

    let res = await request(web.getUri())
      .post('/api/user/signup')
      .send(signUp)
      .expect(200);
    expect(res.body.success).to.be.true;
    expect(res.body.password).to.be.null;
  }


  @test
  async 'lifecycle signup -> login -> get user -> logout'() {
    let auth = <Auth>Container.get("Auth");

    let signUp: DefaultUserSignup = auth.getInstanceForSignup();
    signUp.username = 'testmann';
    signUp.mail = 'testman@test.tx';
    signUp.password = 'password';

    let res = await request(web.getUri())
      .post('/api/user/signup')
      .send(signUp)
      .expect(200);

    let c = await bootstrap.getStorage().get("default").connect()
    let data = await c.manager.query("select * from auth_method");

    expect(res.body.success).to.be.true;
    expect(res.body.password).to.be.null;


    let logIn: DefaultUserLogin = auth.getInstanceForLogin();
    logIn.username = 'testmann';
    logIn.password = 'password';

    res = await request(web.getUri())
      .post('/api/user/login')
      .send(logIn)
      .expect(200);


    let token = auth.getToken(res);
    let session = await auth.getSessionByToken(token);
    expect(session).to.not.be.empty;
    expect(session.user.username).to.be.eq(logIn.username);
    expect(res.body.success).to.be.true;
    expect(res.body.isAuthenticated).to.be.true;

    res = await request(web.getUri())
      .get('/api/user')
      .set(auth.getHttpAuthKey(), token)
      .expect(200);

    expect(res.body.success).to.be.true;
    expect(res.body.user.username).to.be.eq(logIn.username);

    res = await request(web.getUri())
      .get('/api/user/logout')
      .set(auth.getHttpAuthKey(), token)
      .expect(200);

    expect(res.body.success).to.be.true;

    res = await request(web.getUri())
      .get('/api/user')
      .set(auth.getHttpAuthKey(), token)
      .expect(401);

    // TODO implement all error handling https://github.com/typestack/routing-controllers/blob/master/sample/sample6-global-middlewares/AllErrorsHandler.ts
    //expect(res.body.success).to.be.false;
    //expect(res.body.error).to.have.length(1);

    //console.log(res.body);

  }

}

