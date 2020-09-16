import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {Bootstrap, Config, Injector, FileUtils, Invoker, ITypexsOptions, PlatformUtils, RuntimeLoader} from '@typexs/base';

import {Auth} from '../../../src/middleware/Auth';
import {IAuthConfig} from '../../../src/libs/auth/IAuthConfig';
import {User} from '../../../src/entities/User';
import {TestHelper} from '../TestHelper';
import {AuthManager} from '../../../src/libs/auth/AuthManager';
import {TEST_STORAGE_OPTIONS} from '../config';

let bootstrap: Bootstrap;

@suite('functional/ldap/auth_ldap_config')
class AuthLdapConfigSpec {

  //
  // before() {
  //   Config.clear();
  //   Container.reset();
  // }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }
  }

  @test
  async 'ldap integration'() {
    // const authCfg: IAuthConfig = {
    //   userClass: User, // ./User as string
    //   methods: {
    //     default: {
    //       type: 'ldap',
    //
    //     }
    //   }
    // };
    //
    // const json = FileUtils.getJsonSync(__dirname + '/../../../package.json');
    // const loader = new RuntimeLoader({
    //   appdir: PlatformUtils.pathResolve('.'),
    //   libs: json.typexs.declareLibs
    // });
    //
    // await loader.prepare();
    // Container.set('RuntimeLoader', loader);
    // Config.set('auth', authCfg);
    // const invoker = new Invoker();
    // Bootstrap.prepareInvoker(invoker, loader);
    //
    // Container.set(Invoker.NAME, invoker);

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
            type: 'ldap',

          }
        }
      }
    });


    // const storage = await TestHelper.storage();

    //
    // const manager = Container.get(AuthManager);
    // Container.set(AuthManager.NAME, manager);
    // await manager.prepare();


    const auth = Injector.get(Auth);
    // await auth.prepare({});

    const adapters = auth.getManager().getDefinedAdapters();
    const authMethods = auth.getUsedAuthMethods();
    const authMethodsInfo = auth.getSupportedMethodsInfos();

    expect(adapters.map(x => x.name)).to.contain('ldap');
    expect(adapters.map(x => x.className)).to.contain('LdapAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);
    expect(authMethodsInfo.map(x => x.label)).to.deep.eq(['Default']);

    // storage.getNames().map(x => storage.get(x).shutdown());
  }
}

