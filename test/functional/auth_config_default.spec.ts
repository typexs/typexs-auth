import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import {Config, Container, FileUtils, PlatformUtils, RuntimeLoader, Storage} from "typexs-base";

import {Auth} from "../../src/middleware/Auth";
import {AuthUser} from "../../src/entities/AuthUser";
import {IAuthConfig} from "../../src/libs/auth/IAuthConfig";

@suite('functional/auth_config')
class AuthConfigSpec {


  before() {
    Config.clear();

  }


  after() {
    Config.clear();
  }

  @test
  async 'auth config'() {
    let authCfg: IAuthConfig = {
      userClass: AuthUser, // ./User as string
      methods: {
        default: {
          type: 'database',

        }
      }
    };

    let json = FileUtils.getJsonSync(__dirname + '/../../package.json');
    let loader = new RuntimeLoader({
      appdir: PlatformUtils.pathResolve('.'),
      libs: json.typexs.declareLibs
    });

    await loader.prepare();
    Container.set("RuntimeLoader", loader);
    Config.set('auth', authCfg);
    let storage = new Storage();
    let storageRef = storage.register('default', <any>{
      name: 'default',
      type: "sqlite",
      database: ":memory:"
    })
    await storageRef.prepare();
    Container.set('storage.default', storageRef);


    let auth = Container.get(Auth);
    await auth.prepare({});

    let adapters = auth.getDefinedAdapters();
    let authMethods = auth.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.contains('database');
    expect(adapters.map(x => x.className)).to.contains('DatabaseAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);

  }
}

