import {suite, test, timeout} from '@testdeck/mocha';
import * as request from 'supertest';

import {K_ROUTE_CONTROLLER, WebServer} from '@typexs/server';
import {Bootstrap, Config, Injector} from '@typexs/base';

import {Auth} from '../../../src/middleware/Auth';
import {DefaultUserSignup} from '../../../src/libs/models/DefaultUserSignup';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {TESTDB_SETTING, TestHelper} from '../TestHelper';
import {IDatabaseAuthOptions} from '../../../src/adapters/auth/db/IDatabaseAuthOptions';
import {IAuthConfig} from '../../../src/libs/auth/IAuthConfig';
import {expect} from 'chai';
import {DefaultUserLogin} from '../../../src/libs/models/DefaultUserLogin';
import {User} from '../../../src';
import {Role} from '@typexs/roles/entities/Role';
import {RBelongsTo} from '@typexs/roles';
import {EntityController} from '@typexs/schema';
import {TypeOrmConnectionWrapper} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';

let web: WebServer = null;


const OPTIONS = <ITypexsOptions>{
  app: {
    path: __dirname + '/../fake_app_db'
  },

  modules: {
    paths: [
      __dirname + '/../../..'
    ]

  },

  storage: {
    default: TESTDB_SETTING
  },
  initialise: {
    roles: [
      {
        role: 'testrole',
        label: 'testrole',
        permissions: ['check test permission']
      }
    ],
    users: [
      {
        adapter: 'default',
        username: 'testuser',
        mail: 'adim@admin.local',
        password: 'password',
        roles: ['testrole']
      }
    ],
  },
  auth: <IAuthConfig>{
    methods: {
      default: <IDatabaseAuthOptions>{
        type: 'database',
        approval: {
          auto: true
        }
      }
    }
  },
  logging: {
    enable: true,
    level: 'debug',
    transports: [{console: {}}]
  },
  server: {
    default: {
      type: 'web',
      framework: 'express',
      routes: [{
        type: K_ROUTE_CONTROLLER,
        routePrefix: 'api',
        context: 'api'
      }]
    }
  }
};


let bootstrap: Bootstrap = null;

@suite('functional/database/auth_database_permissions') @timeout(20000)
class AuthDatabasePermissionsSpec {

  static async before() {
    Config.clear();
    Injector.reset();

    bootstrap = await TestHelper.bootstrap_basic(
      OPTIONS,
      [{type: 'system'}]
    );

    web = Injector.get('server.default');

    // const uri = web.getUri();
    // const routes = web.getRoutes();

    await web.start();

  }

  static async after() {
    if (web) {
      await web.stop();
    }
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();

  }


  @test
  async 'lifecycle signup -> login -> get user -> logout'() {
    const entityController = <EntityController>Injector.get('EntityController.default');

    const c = await entityController.storageRef.connect() as TypeOrmConnectionWrapper;
    const _users = await c.manager.getRepository(User).find();
    const rBelongsTo = await c.manager.getRepository(RBelongsTo).find();
    const roles = await c.manager.getRepository(Role).find();
    await c.close();

    expect(_users).to.have.length(1);
    expect(rBelongsTo).to.have.length(2);
    expect(roles).to.have.length(1);
    const users = await entityController.find(User) as User[];
    expect(users).to.have.length(1);
    expect(users[0].roles).to.have.length(1);

    const auth = <Auth>Injector.get('Auth');

    // not authorized and no access permissison
    let res = await request(web.getUri())
      .get('/api/permissionsTest')
      .expect(401);


    const signUp: DefaultUserSignup = auth.getInstanceForSignup();
    signUp.username = 'testmann';
    signUp.mail = 'testman@test.tx';
    signUp.password = 'password';
    signUp.passwordConfirm = 'password';

    res = await request(web.getUri())
      .post('/api/user/signup')
      .send(signUp)
      .expect(200);

    expect(res.body.$state.success).to.be.true;
    expect(res.body.password).to.be.null;
    expect(res.body.passwordConfirm).to.be.null;


    let logIn: DefaultUserLogin = auth.getInstanceForLogin();
    logIn.username = 'testmann';
    logIn.password = 'password';

    res = await request(web.getUri())
      .post('/api/user/login')
      .send(logIn)
      .expect(200);

    expect(res.body.$state.success).to.be.true;
    expect(res.body.$state.isAuthenticated).to.be.true;

    let token = auth.getToken(res);
    let session = await auth.getSessionByToken(token);
    expect(session).to.not.be.empty;
    let user = await auth.getUser(session.userId);
    expect(user.id).to.be.eq(session.userId);
    expect(user.username).to.be.eq(logIn.username);


// user is not authorized because of permissions
    res = await request(web.getUri())
      .get('/api/permissionsTest')
      .set(auth.getHttpAuthKey(), token)
      .expect(401);
    let message = res.body;
    expect(message.name).to.be.eq('UnauthorizedError');
    expect(message.message).to.be.eq('Restricted access error.');
    console.log(res.body);


    // login as user with permissions
    logIn = auth.getInstanceForLogin();
    logIn.username = 'testuser';
    logIn.password = 'password';
    res = await request(web.getUri())
      .post('/api/user/login')
      .send(logIn)
      .expect(200);

    expect(res.body.$state.success).to.be.true;
    expect(res.body.$state.isAuthenticated).to.be.true;

    token = auth.getToken(res);
    session = await auth.getSessionByToken(token);
    expect(session).to.not.be.empty;
    user = await auth.getUser(session.userId);
    expect(user.id).to.be.eq(session.userId);
    expect(user.username).to.be.eq(logIn.username);

    res = await request(web.getUri())
      .get('/api/permissionsTest')
      .set(auth.getHttpAuthKey(), token)
      .expect(200);
    message = res.body;
    expect(message).to.deep.eq({test: 'welt'});


  }

}

