import {IActivator, Injector} from '@typexs/base';
import {AuthManager} from './libs/auth/AuthManager';
import {Auth} from './middleware/Auth';
import {BasicPermission, IPermissionDef, IPermissions} from '@typexs/roles-api';
import {PERMISSION_ALLOW_ADMINISTER_PERMISSIONS} from './libs/Constants';

export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
    const manager = Injector.get(AuthManager);
    Injector.set(AuthManager.NAME, manager);
    Injector.set(AuthManager, manager);

    const auth = Injector.get(Auth);
    Injector.set(Auth.NAME, auth);
    Injector.set(Auth, auth);

    await manager.initialize();
  }


  permissions(): IPermissionDef[] {
    return [new BasicPermission(PERMISSION_ALLOW_ADMINISTER_PERMISSIONS)];
  }


}
