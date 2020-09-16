import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Injector, StorageRef, TypeOrmEntityRegistry} from '@typexs/base';
import * as _ from 'lodash';
import {expect} from 'chai';
import {TESTDB_SETTING, TestHelper} from './TestHelper';
import {EntityController} from '@typexs/schema';
import {User} from '../../src/entities/User';
import {Permission} from '@typexs/roles';
import {Role} from '@typexs/roles/entities/Role';
import {TypeOrmConnectionWrapper} from '@typexs/base/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';


const settingsTemplate = {
  logging: {enable: false, level: 'debug'},
  storage: {
    default: TESTDB_SETTING
  }
};

let bootstrap: Bootstrap;

@suite('functional/entity_schema') @timeout(20000)
class EntitySchemaSpec {

  static async before() {
    const settings = _.clone(settingsTemplate);
    bootstrap = await TestHelper.bootstrap_basic(settings);

  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'create schema'() {
    const ref: StorageRef = Injector.get('storage.default');
    const controller: EntityController = Injector.get('EntityController.default');
    const c = await ref.connect() as TypeOrmConnectionWrapper;

    const tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      'auth_method',
      'auth_session',
      'permission',
      'role',
      'r_belongsto',
      'user'
    ]);

    let permission = new Permission();
    permission.permission = 'can do everything';
    permission.disabled = false;
    permission.module = 'test';
    permission.type = 'single';

    permission = await controller.save(permission);

    let role = new Role();
    role.rolename = 'admin';
    role.disabled = false;
    role.displayName = 'Administrator';
    role.permissions = [permission];

    role = await controller.save(role);

    let found = await controller.find(Role, {id: 1});

    // TODO current reseted permission, because of double insertes
    role.permissions = null;

    let user = new User();
    user.username = 'testuser';
    user.displayName = 'Test user';
    user.disabled = false;
    user.mail = 'test@testuser.de';
    user.roles = [role];

    user = await controller.save(user);

    found = await controller.find(Role, {id: 1});

    const results: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(results).to.have.length(2);

  }

  @test
  async 'check schema data'() {
    const entity = TypeOrmEntityRegistry.$().getEntityRefFor('RBelongsTo');
    const props = entity.getPropertyRefs();
    expect(props).to.have.length(7);
  }

}
