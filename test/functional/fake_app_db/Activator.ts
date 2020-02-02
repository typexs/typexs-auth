import {IActivator} from '@typexs/base';
import {BasicPermission, IPermissionDef, IPermissions} from '@typexs/roles-api';

export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
  }

  permissions(): IPermissionDef[] {
    return [
      new BasicPermission('check test permission')
    ];
  }

}
