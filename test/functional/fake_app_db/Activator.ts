import {IActivator, IPermissions} from "@typexs/base";

export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
  }

  permissions(): Promise<string[]> | string[] {
    return ['check test permission'];
  }

}
