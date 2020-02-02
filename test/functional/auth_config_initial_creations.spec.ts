import {suite, test, timeout} from 'mocha-typescript';
import {Bootstrap, Container, Invoker} from '@typexs/base';
import {expect} from 'chai';
import {User} from '../../src/entities/User';
import {TESTDB_SETTING} from './TestHelper';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {AuthHelper} from '../../src/libs/auth/AuthHelper';
import {AuthManager} from '../../src';
import {EntityController} from '@typexs/schema';

// process.env['LOG'] = 'asd';

// const OPTIONS: ITypexsOptions = <ITypexsOptions>{
//   storage: {
//     default: TESTDB_SETTING
//   },
//   auth: {
//     // allowSignup: true,
//     methods: {
//       default: {
//         type: 'database',
//       }
//     }
//   }
// };


let bootstrap: Bootstrap = null;

@suite('functional/auth_config_initial_creations') @timeout(20000)
class AuthConfigSpec {


  before() {
    Bootstrap.reset();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();

  }


  // @test
  // async 'init roles'() {
  //   let opts = <any>_.clone(OPTIONS);
  //   (<IAuthConfig>opts.auth).initRoles = [
  //     {role: 'admin', displayName: 'Admin', permissions: ['*']},
  //     {role: 'user', displayName: 'User', permissions: ['allow see profile', 'allow edit profile']},
  //   ];
  //
  //   let name = 'default';
  //
  //   let ref = await TestHelper.bootstrap_auth(name, opts);
  //   bootstrap = ref.bootstrap;
  //   let xsem = ref.controller;
  //
  //   let roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
  //   expect(roles).to.have.length(2);
  //
  //   // Try again should do notthing
  //   roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
  //   expect(roles).to.have.length(0);
  //
  //
  // }
  //
  // @test
  // async 'init roles on already present data'() {
  //
  //   let opts = <any>_.clone(OPTIONS);
  //   (<IAuthConfig>opts.auth).initRoles = [
  //     {role: 'admin', displayName: 'Admin', permissions: ['*']},
  //     {role: 'user', displayName: 'User', permissions: ['allow see profile', 'allow edit profile']},
  //   ];
  //
  //   let name = 'default';
  //
  //   let ref = await TestHelper.bootstrap_auth(name, opts);
  //   bootstrap = ref.bootstrap;
  //
  //   let xsem = ref.controller;
  //
  //   let c = await xsem.storageRef.connect();
  //   let p = new Permission();
  //   p.permission = "*";
  //   p.module = '@typexs/auth';
  //   p.type = 'single';
  //   await c.manager.getRepository(Permission).save(p);
  //
  //   let b = Bootstrap.getContainer().get(BootstrapAuth);
  //   await b.bootstrap();
  //
  //   let roles = await AuthHelper.initRoles(xsem, opts.auth.initRoles);
  //   expect(roles).to.have.length(0);
  //
  // }

  @test
  async 'init users'() {

    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(<ITypexsOptions & any>{
        // app: {name: 'test', nodeId: 'worker'},
        logging: {enable: true, level: 'debug'},
        // modules: {paths: [__dirname + '/../../..']},
        storage: {
          default: TESTDB_SETTING
        },
        auth: {
          // allowSignup: true,
          methods: {
            default: {
              type: 'database',
            }
          }
        },
        // storage: {default: TEST_STORAGE_OPTIONS},
        // workers: {access: [{name: 'TaskMonitorWorker', access: 'allow'}]},
        // auth: {
        //   userClass: User, // ./User as string
        //   methods: {
        //     default: {
        //       type: 'database',
        //     }
        //   }
        // }
        initialise: {
          roles: [
            {
              role: 'admin', label: 'Admin', permissions: ['*']
            },
            {
              role: 'user', label: 'User',
              permissions: ['allow see profile', 'allow edit profile']
            },
          ],
          // users:
        }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const name = 'default';

    // const ref = await TestHelper.bootstrap_auth(name, opts);
    // bootstrap = ref.bootstrap;
    // /// let auth = ref.auth;
    // const manager = ref.authManager;
    // const xsem = ref.controller;
    // const invoker = ref.invoker;

    const invoker = Container.get(Invoker.NAME) as Invoker; // await AuthHelper.initRoles(xsem, opts.auth.initRoles);
    const xsem = Container.get('EntityController.default') as EntityController;
    const authManager = Container.get(AuthManager.NAME) as AuthManager;
    const initUsers = [
      {
        username: 'admin',
        adapter: 'default',
        mail: 'admin@localhost.local',
        password: 'admin123',
        roles: ['admin']
      }
    ];

    let users = await AuthHelper.initUsers(invoker, xsem, authManager, initUsers);
    expect(users).to.have.length(1);

    users = await AuthHelper.initUsers(invoker, xsem, authManager, initUsers);
    expect(users).to.have.length(0);

    users = await xsem.find(User, null, {limit: 0});
    // console.log(users);

    expect(users[0].getRoles()).to.have.length(1);


  }
}

