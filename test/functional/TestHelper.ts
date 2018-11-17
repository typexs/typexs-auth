import {Bootstrap, SqliteSchemaHandler, StorageRef} from "@typexs/base";
import {PlatformTools} from 'typeorm/platform/PlatformTools';
import {EntityController, EntityRegistry, FrameworkFactory} from "@typexs/schema";
import _ = require("lodash");


export const TESTDB_SETTING = {
  synchronize: true,
  type: 'sqlite',
  database: ':memory:',
  logger: 'simple-console',
  logging: 'all'
}


export class TestHelper {

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


  static async bootstrap_basic(options: any = {}, config: any = [{type: 'system'}]) {
    let _options = _.clone(options);
    let bootstrap = Bootstrap.setConfigSources(config).configure(_options).activateErrorHandling().activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    return bootstrap;
  }


}
