import {suite, test, timeout} from "mocha-typescript";
import {expect} from 'chai';
import {Config, Container, FileUtils, PlatformUtils, RuntimeLoader} from "@typexs/base";

import {Auth} from "../../src/middleware/Auth";

import {IAuthConfig} from "../../src/libs/auth/IAuthConfig";
import {User} from "../../src/entities/User";
import {TestHelper} from "./TestHelper";
import {AuthManager} from "../../src/libs/auth/AuthManager";

@suite('functional/auth_config_default') @timeout(10000)
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
      userClass: User, // ./User as string
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




    const options = {name: 'default'};
    let ref = await TestHelper.storage();

    let manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    await manager.prepare();

    let auth = Container.get(Auth);
    await auth.prepare({});

    let adapters = auth.getManager().getDefinedAdapters();
    let authMethods = auth.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.contains('database');
    expect(adapters.map(x => x.className)).to.contains('DatabaseAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);

  }
}

