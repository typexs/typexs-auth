import {
  Bootstrap as CoreBootrap,
  ClassesLoader,
  Container,
  IBootstrap,
  Inject,
  Invoker,
  IPermissions, Log,
  StorageRef
} from "@typexs/base";
import {Permission} from "./entities/Permission";
import * as _ from 'lodash'
import {AuthHelper} from "./libs/auth/AuthHelper";

import {EntityController} from "@typexs/schema";
import {AuthManager} from "./libs/auth/AuthManager";


export class Bootstrap implements IBootstrap {

  @Inject('storage.default')
  private storageRef: StorageRef;

  @Inject(AuthManager.NAME)
  private authManager: AuthManager;

  @Inject(Invoker.NAME)
  private invoker: Invoker;


  async bootstrap() {
    await this.authManager.prepare();
    const activators = CoreBootrap._().getActivators();

    // collect permissions
    let backend = await this.storageRef.connect();
    let foundPermissions = await backend.manager.find(Permission);
    let storePermission: Permission[] = [];

    for (let activator of activators) {
      const ipermissions: IPermissions = (<IPermissions>(<any>activator));
      if (ipermissions.permissions) {
        // if methods

        let _module = ClassesLoader.getModulName((<any>ipermissions).__proto__.constructor);
        let modul_permissions = await ipermissions.permissions();

        modul_permissions.forEach(p => {
          let _permissions = _.remove(foundPermissions, fp => fp.permission == p && fp.module == _module);
          let permission = new Permission();
          if (_permissions.length == 1) {
            permission = _permissions.shift();
          } else if (_permissions.length > 1) {
            throw new Error('to many permissions ' + JSON.stringify(p));
          } else {
            permission.permission = p;
            permission.disabled = false;
            permission.type = 'single';
            permission.module = _module;
            storePermission.push(permission);
          }
        })
      }
    }

    if (storePermission.length > 0) {
      await backend.manager.save(storePermission);
    }

    let authConfig = this.authManager.getConfig();

    let controller: EntityController = Container.get('EntityController.default');

    if (authConfig.initRoles) {
      Log.info('init roles');
      await AuthHelper.initRoles(controller, authConfig.initRoles);
    }

    if (authConfig.initUsers) {
      // user are dependent by the adapter + roles mapping
      Log.info('init users');
      await AuthHelper.initUsers(this.invoker, controller, this.authManager, authConfig.initUsers);
    }
    /* skip cleanup
    if(foundPermissions.length > 0){
      await backend.manager.remove(foundPermissions);
    }
    */


    // TODO create default permissions

    // TODO create default roles

    // TODO create default user
  }

}

