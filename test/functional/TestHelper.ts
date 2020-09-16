import {
  Bootstrap,
  DefaultSchemaHandler,
  IConfigOptions,
  Injector,
  Invoker,
  IStorageOptions,
  SqliteSchemaHandler,
  Storage,
  StorageRef
} from '@typexs/base';
import {EntityController, EntityRegistry, FrameworkFactory} from '@typexs/schema';
import {AuthManager} from '../../src/libs/auth/AuthManager';
import {Auth} from '../../src/middleware/Auth';
import _ = require('lodash');


export const TESTDB_SETTING: IStorageOptions & any =
  process.env.LOG ? {
    synchronize: true,
    type: 'sqlite',
    database: ':memory:',
    logger: 'simple-console',
    logging: 'all',
    connectOnStartup: true
  } : {
    synchronize: true,
    type: 'sqlite',
    database: ':memory:',
    connectOnStartup: true
  };


export class TestHelper {


  static async storage(name: string = 'default', options = TESTDB_SETTING) {
    const storage = new Storage();
    storage['schemaHandler']['__default__'] = DefaultSchemaHandler;
    storage['schemaHandler']['sqlite'] = SqliteSchemaHandler;
    const storageRef = await storage.register(name, options);
    // await storageRef.prepare();
    Injector.set('storage.' + name, storageRef);
    const schemaDef = EntityRegistry.getSchema(name);
    const framework = FrameworkFactory.$().get(storageRef);
    const xsem = new EntityController(name, schemaDef, storageRef, framework);
    await xsem.initialize();
    Injector.set('EntityController.' + name, xsem);
    return storage;
  }

  //
  // static async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
  //   const ref = new StorageRef(options);
  //   ref.setSchemaHandler(Reflect.construct(SqliteSchemaHandler, [ref]));
  //   await ref.prepare();
  //   const schemaDef = EntityRegistry.getSchema(options.name);
  //
  //   const framework = FrameworkFactory.$().get(ref);
  //   const xsem = new EntityController(options.name, schemaDef, ref, framework);
  //   await xsem.initialize();
  //
  //   return {ref: ref, controller: xsem};
  // }

  /*
    static resetTypeorm() {
      PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
    }
  */

  static async bootstrap_basic(options: any = {},
                               config: IConfigOptions[] = [{type: 'system'}],
                               settings = {startup: true}) {
    // TestHelper.resetTypeorm();

    const _options = _.clone(options);
    const bootstrap = Bootstrap
      .setConfigSources(config)
      .configure(_options)
      .activateErrorHandling()
      .activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    if (settings.startup) {
      await bootstrap.startup();
    }
    return bootstrap;
  }


  static async bootstrap_auth(name: string, options: any = {},
                              config: IConfigOptions[] = [{type: 'system'}], settings = {startup: true}) {
    const bootstrap = await TestHelper.bootstrap_basic(options, config, settings);
    const schemaDef = EntityRegistry.getSchema(name);
    const ref = bootstrap.getStorage().get(name);
    const framework = FrameworkFactory.$().get(ref);

    const xsem = new EntityController(name, schemaDef, ref, framework);
    await xsem.initialize();
    Injector.set('EntityController.' + name, xsem);

    const manager = Injector.get(AuthManager);
    Injector.set(AuthManager.NAME, manager);
    await manager.prepare();

    const auth = Injector.get(Auth);
    await auth.prepare();

    return {
      bootstrap: bootstrap,
      auth: auth,
      authManager: manager,
      controller: xsem,
      invoker: <Invoker>Injector.get(Invoker.NAME)
    };


  }


}
