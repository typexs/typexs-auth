import {suite, test, timeout} from '@testdeck/mocha';
import {expect} from 'chai';
import {Bootstrap, Injector, ITypexsOptions} from '@typexs/base';

import {Auth} from '../../src/middleware/Auth';
import {User} from '../../src/entities/User';
import {TEST_STORAGE_OPTIONS} from './config';
import {TestHelper} from './TestHelper';

let bootstrap: Bootstrap;

@suite('functional/auth_config_default') @timeout(20000)
class AuthConfigSpec {

  //
  // before() {
  //   Config.clear();
  //   Container.reset();
  // }
  //
  //
  // after() {
  //   Config.clear();
  //   Container.reset();
  //
  // }

  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }
  }


  @test
  async 'auth config'() {
    bootstrap = await TestHelper.bootstrap_basic(<ITypexsOptions & any>{
      // app: {name: 'test', nodeId: 'worker'},
      logging: {enable: true, level: 'debug'},
      // modules: {paths: [__dirname + '/../../..']},
      storage: {default: TEST_STORAGE_OPTIONS},
      // workers: {access: [{name: 'TaskMonitorWorker', access: 'allow'}]},
      auth: {
        userClass: User, // ./User as string
        methods: {
          default: {
            type: 'database',

          }
        }
      }
    });

    // const authCfg: IAuthConfig = {
    // };
    //
    // const json = FileUtils.getJsonSync(__dirname + '/../../package.json');
    // const loader = new RuntimeLoader({
    //   appdir: PlatformUtils.pathResolve('.'),
    //   libs: json.typexs.declareLibs
    // });
    //
    // await loader.prepare();
    // Container.set('RuntimeLoader', loader);
    // Config.set('auth', authCfg);
    //
    // const invoker = new Invoker();
    // Bootstrap.prepareInvoker(invoker, loader);
    // Container.set(Invoker.NAME, invoker);
    //
    // Container.set(PermissionsRegistry'RuntimeLoader', loader);
    //
    //
    // const storage = await TestHelper.storage();
    //
    // const manager = Container.get(AuthManager);
    // Container.set(AuthManager.NAME, manager);
    // await manager.prepare();

    const auth = Injector.get(Auth);
    await auth.prepare({});

    const adapters = auth.getManager().getDefinedAdapters();
    const authMethods = auth.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.contains('database');
    expect(adapters.map(x => x.className)).to.contains('DatabaseAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);

    await bootstrap.shutdown();
    // storage.getNames().map(x => storage.get(x).shutdown());
    Bootstrap.reset();
  }
}

