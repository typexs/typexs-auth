import {IActivator, Injector} from '@typexs/base';
import {AuthManager} from './libs/auth/AuthManager';
import {Auth} from './middleware/Auth';

export class Activator implements IActivator {


  async startup(): Promise<void> {
    const manager = Injector.get(AuthManager);
    Injector.set(AuthManager.NAME, manager);
    Injector.set(AuthManager, manager);

    const auth = Injector.get(Auth);
    Injector.set(Auth.NAME, auth);
    Injector.set(Auth, auth);

    await manager.initialize();
  }


}
