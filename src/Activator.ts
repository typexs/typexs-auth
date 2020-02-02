import {IActivator, Container} from '@typexs/base';
import {AuthManager} from './libs/auth/AuthManager';
import {Auth} from './middleware/Auth';

export class Activator implements IActivator {


  async startup(): Promise<void> {
    const manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    Container.set(AuthManager, manager);

    const auth = Container.get(Auth);
    Container.set(Auth.NAME, auth);
    Container.set(Auth, auth);

    await manager.prepare();
  }


}
