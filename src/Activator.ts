import {IActivator, IPermissions, Container} from "@typexs/base";
import {AuthManager} from "./libs/auth/AuthManager";

export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
    let manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    await manager.prepare();

  }

  permissions(): Promise<string[]> | string[] {
    return ['*'];
  }

}
