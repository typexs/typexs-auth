import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Config} from "@typexs/base";
import * as _ from 'lodash';
import {expect} from 'chai';
import {IAuthConfig} from "../../src/libs/auth/IAuthConfig";
import {User} from "../../src/entities/User";
import {TESTDB_SETTING, TestHelper} from "./TestHelper";
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";
import {AuthHelper} from "../../src/libs/auth/AuthHelper";
import {Permission} from "../../src";
import {Startup as BootstrapAuth} from './../../src/Startup';

//process.env['LOG'] = 'asd';

const OPTIONS: ITypexsOptions = <ITypexsOptions>{
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    //allowSignup: true,
    methods: {
      default: {
        type: 'database',
      }
    }
  }
};


let bootstrap: Bootstrap = null;

@suite('functional/auth_config_initial_creations') @timeout(20000)
class AuthConfigSpec {


  before() {
    Bootstrap.reset();
    Config.clear();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
    Config.clear();

  }


  @test
  async 'init roles'() {
    let opts = <any>_.clone(OPTIONS);
    (<IAuthConfig>opts.auth).initRoles = [
      {role: 'admin', displayName: 'Admin', permissions: ['*']},
      {role: 'user', displayName: 'User', permissions: ['allow see profile', 'allow edit profile']},
    ];

    let name = 'default';

    let ref = await TestHelper.bootstrap_auth(name, opts);
    bootstrap = ref.bootstrap;
    let xsem = ref.controller;

    let roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
    expect(roles).to.have.length(2);

    // Try again should do notthing
    roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
    expect(roles).to.have.length(0);


  }

  @test
  async 'init roles on already present data'() {

    let opts = <any>_.clone(OPTIONS);
    (<IAuthConfig>opts.auth).initRoles = [
      {role: 'admin', displayName: 'Admin', permissions: ['*']},
      {role: 'user', displayName: 'User', permissions: ['allow see profile', 'allow edit profile']},
    ];

    let name = 'default';

    let ref = await TestHelper.bootstrap_auth(name, opts);
    bootstrap = ref.bootstrap;

    let xsem = ref.controller;

    let c = await xsem.storageRef.connect();
    let p = new Permission();
    p.permission = "*";
    p.module = '@typexs/auth';
    p.type = 'single';
    await c.manager.getRepository(Permission).save(p);

    let b = Bootstrap.getContainer().get(BootstrapAuth);
    await b.bootstrap();

    let roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
    expect(roles).to.have.length(0);

  }

  @test
  async 'init users'() {
    let opts = <any>_.clone(OPTIONS);
    (<IAuthConfig>opts.auth).initRoles = [
      {
        role: 'admin', displayName: 'Admin', permissions: ['*']
      },
      {
        role: 'user', displayName: 'User',
        permissions: ['allow see profile', 'allow edit profile']
      },
    ];
    (<IAuthConfig>opts.auth).initUsers = [
      {
        username: 'admin', adapter: 'default', mail: 'admin@localhost.local',
        password: 'admin123', roles: ['admin']
      }
    ];
    let name = 'default';

    let ref = await TestHelper.bootstrap_auth(name, opts);
    bootstrap = ref.bootstrap;
    ///let auth = ref.auth;
    let manager = ref.authManager;
    let xsem = ref.controller;
    let invoker = ref.invoker;


    await AuthHelper.initRoles(xsem, opts.auth.initRoles);

    let users = await AuthHelper.initUsers(invoker, xsem, manager, opts.auth.initUsers);
    expect(users).to.have.length(1);

    users = await AuthHelper.initUsers(invoker, xsem, manager, opts.auth.initUsers);
    expect(users).to.have.length(0);


  }
}

