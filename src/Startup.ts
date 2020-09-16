import * as _ from 'lodash';
import {Config, IBootstrap, Inject, Injector, Invoker, Log, StorageRef} from '@typexs/base';
import {AuthHelper} from './libs/auth/AuthHelper';
import {AuthManager} from './libs/auth/AuthManager';
import {IConfigUser} from './libs/models/IConfigUser';
import {IEntityController} from '@typexs/base/browser';


export class Startup implements IBootstrap {

  @Inject('storage.default')
  private storageRef: StorageRef;

  @Inject(AuthManager.NAME)
  private authManager: AuthManager;

  @Inject(Invoker.NAME)
  private invoker: Invoker;


  async bootstrap() {

    await this.authManager.prepare();
    // const activators = Bootstrap._().getActivators();
    //
    // // collect permissions
    // const backend = await this.storageRef.connect();
    // const foundPermissions = await backend.manager.find(Permission);
    // let storePermission: Permission[] = [];
    //
    // for (const activator of activators) {
    //   const ipermissions: IPermissions = (<IPermissions>(<any>activator));
    //   if (ipermissions.permissions) {
    //     // if methods
    //
    //     const _module = ClassesLoader.getModulName((<any>ipermissions).__proto__.constructor);
    //     const modul_permissions = await ipermissions.permissions();
    //
    //     modul_permissions.forEach(p => {
    //       const _permissions = _.find(foundPermissions, fp => fp.permission === p);
    //       if (!_permissions) {
    //         const alreadyInList = _.find(storePermission, _p => _p.permission === p);
    //         if (!alreadyInList) {
    //           const permission = new Permission();
    //           permission.permission = p;
    //           permission.disabled = false;
    //           permission.type = /\*/.test(p) ? 'pattern' : 'single';
    //           permission.module = _module;
    //           storePermission.push(permission);
    //         }
    //       }
    //     });
    //   }
    // }
    //
    // if (storePermission.length > 0) {
    //   storePermission = _.uniq(storePermission);
    //   await backend.manager.save(storePermission);
    // }

    // const authConfig = this.authManager.getConfig();
    // if (authConfig.initRoles) {
    //   Log.info('init roles');
    //   await AuthHelper.initRoles(controller, authConfig.initRoles);
    // }

    const cfgUsers = Config.get('initialise.users', []) as IConfigUser[];

    if (!_.isEmpty(cfgUsers)) {
      // user are dependent by the adapter + roles mapping
      Log.info('init users');
      const controller: IEntityController = Injector.get('EntityController.default');
      await AuthHelper.initUsers(this.invoker, controller, this.authManager, cfgUsers);
    }
    /* skip cleanup
    if(foundPermissions.length > 0){
      await backend.manager.remove(foundPermissions);
    }
    */

    // if (backend) {
    //   await backend.close();
    // }

  }

}

