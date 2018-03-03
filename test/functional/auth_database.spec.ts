import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import * as _ from 'lodash';
import * as request from 'supertest';

import {ServerRegistry, WebServer, K_ROUTE_CONTROLLER, C_DEFAULT} from "typexs-server";
import {
  Bootstrap,
  Config,
  IFileConfigOptions,
  PlatformUtils,
  FileUtils,
  ClassesLoader,
  Container,
  RuntimeLoader, ITypexsOptions, Log
} from "typexs-base";

import {IAuthConfig, Auth} from "../../src/middleware/Auth";
import {AuthUser} from "../../src/entities/AuthUser";
import * as path from "path";
import {AuthUserSignup} from "../../src/libs/models/AuthUserSignup";
import {AuthUserLogin} from "../../src/libs/models/AuthUserLogin";
import {inspect} from "util";

let bootstrap: Bootstrap = null;
let web: WebServer = null;

@suite('functional/auth_database')
class AuthConfigSpec {

  static async before() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
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
      type: 'web', framework: 'express', routes: [{
        type: K_ROUTE_CONTROLLER,
        routePrefix: 'api',
        context: 'api'
      }]
    });

    await web.prepare();
    let uri = web.getUri();
    let routes = web.getRoutes();

    //let c = await Bootstrap._().getStorage().get('default').connect();
    //c.manager.query('')

    console.log(routes);
    console.log("URI=" + uri);
    let started = await web.start();

  }

  static async after() {
    await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'database signup'() {
    let auth = <Auth>Container.get("Auth");
    let signUp: AuthUserSignup = auth.getInstanceForSignup();
    signUp.username = 'superman';
    signUp.mail = 'superman@test.me';
    signUp.password = 'password';

    let res = await request(web.getUri())
      .post('/api/user/signup')
      .send(signUp)
      .expect(200);

    expect(res.body.success).to.be.true;
    expect(res.body.password).to.be.null;
  }

  @test.only()
  async 'database lifecycle signup -> login -> get user -> logout'() {
    let auth = <Auth>Container.get("Auth");

    let signUp: AuthUserSignup = auth.getInstanceForSignup();
    signUp.username = 'testmann';
    signUp.mail = 'testman@test.tx';
    signUp.password = 'password';

    let res = await request(web.getUri())
      .post('/api/user/signup')
      .send(signUp)
      .expect(200);

    Log.info(res.body);

    let c = await bootstrap.getStorage().get("default").connect()
    let data = await c.manager.query("select * from auth_method");
    Log.info(data);
    //data = await c.manager.query("PRAGMA table_info(auth_session);");
    //Log.info(data);


    expect(res.body.success).to.be.true;
    expect(res.body.password).to.be.null;


    let logIn: AuthUserLogin = auth.getInstanceForLogin();
    logIn.username = 'testmann';
    logIn.password = 'password';

    res = await request(web.getUri())
      .post('/api/user/login')
      .send(logIn)
      .expect(200);

    console.log(inspect(res.body,false,10));
    expect(res.body.success).to.be.true;
    expect(res.body.isAuthenticated).to.be.true;
  }

}

