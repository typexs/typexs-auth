import {suite, test, timeout} from "mocha-typescript";
import {Bootstrap, Config, Container, Log, StorageRef} from "@typexs/base";
import * as _ from "lodash";
import {expect} from "chai";
import {TESTDB_SETTING, TestHelper} from "./TestHelper";
import {Permission} from "../../src/entities/Permission";
import {EntityController} from "@typexs/schema";
import {Role} from "../../src/entities/Role";
import {User} from "../../src/entities/User";

let bootstrap: Bootstrap = null;


const settingsTemplate = {
  logging: {enable: false, level: 'debug'},
  storage: {
    default: TESTDB_SETTING
  }
};


@suite('functional/entity_schema') @timeout(20000)
class Entity_schemaSpec {

  static async before() {

  }


  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'create schema'() {
    let settings = _.clone(settingsTemplate);

    await TestHelper.bootstrap_basic(settings);
    let ref: StorageRef = Container.get('storage.default');
    let controller: EntityController = Container.get('EntityController.default');
    let c = await ref.connect();

    let tables: any[] = await c.connection.query('SELECT * FROM sqlite_master WHERE type=\'table\' and tbl_name not like \'%sqlite%\';');
    expect(_.map(tables, t => t.name)).to.have.include.members([
      "auth_method",
      "auth_session",
      "permission",
      "role",
      "r_belongsto",
      "user"
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

    let results: any[] = await c.connection.query('SELECT * FROM r_belongsto;');
    expect(results).to.have.length(2);
  }


}
