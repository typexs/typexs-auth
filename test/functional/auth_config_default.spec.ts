import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import {
  Config,
  Container,
  DefaultSchemaHandler,
  FileUtils,
  PlatformUtils,
  RuntimeLoader,
  SqliteSchemaHandler,
  Storage
} from "@typexs/base";

import {Auth} from "../../src/middleware/Auth";

import {IAuthConfig} from "../../src/libs/auth/IAuthConfig";
import {User} from "../../src/entities/User";
import {EntityController, EntityRegistry, FrameworkFactory} from "@typexs/schema";

@suite('functional/auth_config_default')
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
    let storage = new Storage();
    storage['schemaHandler']['__default__'] =  DefaultSchemaHandler;
    storage['schemaHandler']['sqlite'] =  SqliteSchemaHandler;
    let storageRef = storage.register('default', <any>{
      name: 'default',
      type: "sqlite",
      database: ":memory:"
    })
    await storageRef.prepare();
    Container.set('storage.default', storageRef);

    const options = {name:'default'};

    let schemaDef = EntityRegistry.getSchema(options.name);

    const framework = FrameworkFactory.$().get(storageRef);
    let entityController = new EntityController(options.name, schemaDef, storageRef, framework);
    await entityController.initialize();
    Container.set('EntityController.default',entityController);


    let auth = Container.get(Auth);
    await auth.prepare({});

    let adapters = auth.getDefinedAdapters();
    let authMethods = auth.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.contains('database');
    expect(adapters.map(x => x.className)).to.contains('DatabaseAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);

  }
}

