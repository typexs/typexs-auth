import {
  Bootstrap,
  DefaultSchemaHandler,
  SqliteSchemaHandler,
  Storage,
  StorageRef,
  Container,
  IStorageOptions
} from "@typexs/base";
import {PlatformTools} from 'typeorm/platform/PlatformTools';
import {EntityController, EntityRegistry, FrameworkFactory} from "@typexs/schema";
import _ = require("lodash");


export const TESTDB_SETTING: IStorageOptions & { database: string } = {
  synchronize: true,
  type: 'sqlite',
  database: ':memory:',
  logger: 'simple-console',
  logging: 'all'
};


export class TestHelper {


  static async storage(name: string = 'default', options = TESTDB_SETTING) {
    let storage = new Storage();
    storage['schemaHandler']['__default__'] = DefaultSchemaHandler;
    storage['schemaHandler']['sqlite'] = SqliteSchemaHandler;
    let storageRef = storage.register(name, options);
    await storageRef.prepare();
    Container.set('storage.' + name, storageRef);
    let schemaDef = EntityRegistry.getSchema(name);
    const framework = FrameworkFactory.$().get(storageRef);
    let xsem = new EntityController(name, schemaDef, storageRef, framework);
    await xsem.initialize();
    Container.set('EntityController.' + name, xsem);

    return storage;

  }

  static async connect(options: any): Promise<{ ref: StorageRef, controller: EntityController }> {
    let ref = new StorageRef(options);
    ref.setSchemaHandler(Reflect.construct(SqliteSchemaHandler, [ref]));
    await ref.prepare();
    let schemaDef = EntityRegistry.getSchema(options.name);

    const framework = FrameworkFactory.$().get(ref);
    let xsem = new EntityController(options.name, schemaDef, ref, framework);
    await xsem.initialize();

    return {ref: ref, controller: xsem}
  }


  static resetTypeorm() {
    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }


  static async bootstrap_basic(options: any = {}, config: any = [{type: 'system'}], settings={startup:true}) {
    let _options = _.clone(options);
    let bootstrap = Bootstrap.setConfigSources(config).configure(_options).activateErrorHandling().activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    if(settings.startup){
      await bootstrap.startup();
    }


    return bootstrap;
  }


}
