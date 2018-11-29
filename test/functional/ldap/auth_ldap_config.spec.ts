import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import {Config, Container, FileUtils, PlatformUtils, RuntimeLoader, Storage} from "@typexs/base";

import {Auth} from "../../../src/middleware/Auth";
import {IAuthConfig} from "../../../src/libs/auth/IAuthConfig";
import {User} from "../../../src/entities/User";
import {TestHelper} from "../TestHelper";
import {AuthManager} from "../../../src/libs/auth/AuthManager";


@suite('functional/ldap/auth_ldap_config')
class Auth_ldap_configSpec {


  before() {
    Config.clear();
  }


  after() {
    Config.clear();
  }

  @test
  async 'ldap integration'() {
    let authCfg: IAuthConfig = {
      userClass: User, // ./User as string
      methods: {
        default: {
          type: 'ldap',

        }
      }
    };

    let json = FileUtils.getJsonSync(__dirname + '/../../../package.json');
    let loader = new RuntimeLoader({
      appdir: PlatformUtils.pathResolve('.'),
      libs: json.typexs.declareLibs
    });

    await loader.prepare();
    Container.set("RuntimeLoader", loader);
    Config.set('auth', authCfg);


    await TestHelper.storage();


    let manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    await manager.prepare();


    let auth = Container.get(Auth);
    await auth.prepare({});

    let adapters = auth.getManager().getDefinedAdapters();
    let authMethods = auth.getUsedAuthMethods();
    let authMethodsInfo = auth.getSupportedMethodsInfos();

    expect(adapters.map(x => x.name)).to.contain('ldap');
    expect(adapters.map(x => x.className)).to.contain('LdapAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);
    expect(authMethodsInfo.map(x => x.label)).to.deep.eq(['Default']);

  }
}

