import {IActivator, IPermissions, Container} from "@typexs/base";
import {AuthManager} from "./libs/auth/AuthManager";
import {Auth} from "./middleware/Auth";

export class Activator implements IActivator, IPermissions {


  async startup(): Promise<void> {
    let manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    Container.set(AuthManager, manager);

    let auth = Container.get(Auth);
    Container.set(Auth.NAME, auth);
    Container.set(Auth, auth);

    await manager.prepare();
  }

  permissions(): Promise<string[]> | string[] {
    return ['*'];
  }

}
