import {
  ClassesLoader,
  Container,
  IBootstrap,
  Inject,
  Invoker,
  IPermissions, Log,
  StorageRef
} from '@typexs/base';

import {Bootstrap} from '@typexs/base/Bootstrap';
import {Permission} from './entities/Permission';
import * as _ from 'lodash';
import {AuthHelper} from './libs/auth/AuthHelper';
import {EntityController} from '@typexs/schema';
import {AuthManager} from './libs/auth/AuthManager';


export class Startup implements IBootstrap {

  @Inject('storage.default')
  private storageRef: StorageRef;

  @Inject(AuthManager.NAME)
  private authManager: AuthManager;

  @Inject(Invoker.NAME)
  private invoker: Invoker;


  async bootstrap() {

    await this.authManager.prepare();
    const activators = Bootstrap._().getActivators();

    // collect permissions
    const backend = await this.storageRef.connect();
    const foundPermissions = await backend.manager.find(Permission);
    let storePermission: Permission[] = [];

    for (const activator of activators) {
      const ipermissions: IPermissions = (<IPermissions>(<any>activator));
      if (ipermissions.permissions) {
        // if methods

        const _module = ClassesLoader.getModulName((<any>ipermissions).__proto__.constructor);
        const modul_permissions = await ipermissions.permissions();

        modul_permissions.forEach(p => {
          const _permissions = _.find(foundPermissions, fp => fp.permission === p);
          if (!_permissions) {
            const alreadyInList = _.find(storePermission, _p => _p.permission === p);
            if (!alreadyInList) {
              const permission = new Permission();
              permission.permission = p;
              permission.disabled = false;
              permission.type = /\*/.test(p) ? 'pattern' : 'single';
              permission.module = _module;
              storePermission.push(permission);
            }
          }
        });
      }
    }

    if (storePermission.length > 0) {
      storePermission = _.uniq(storePermission);
      await backend.manager.save(storePermission);
    }

    const authConfig = this.authManager.getConfig();
    const controller: EntityController = Container.get('EntityController.default');
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

