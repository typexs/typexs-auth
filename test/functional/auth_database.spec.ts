import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, ITypexsOptions, Log, StorageRef} from "typexs-base";

import {Auth} from "../../src/middleware/Auth";
import {DefaultUserSignup} from "../../src/libs/models/DefaultUserSignup";
import {AuthUser} from "../../src/entities/AuthUser";
import {AuthMethod} from "../../src/entities/AuthMethod";

let bootstrap: Bootstrap = null;

let auth: Auth = null;

@suite('functional/auth_database')
class AuthConfigSpec {

  static async before() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
        auth: {
          methods: {
            default: {
              type: 'database',
              allowSignup: true
            }
          }
        }
      })
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();
  }

  static async after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test.only()
  async 'do signup'() {
    let signUp: DefaultUserSignup = auth.getInstanceForSignup('default');
    signUp.username = 'superman';
    signUp.mail = 'superman@test.me';
    signUp.password = 'password';
    let res: any = {};
    let req: any = {};
    let doingSignup = await auth.doSignup(signUp, req, res);
    Log.info(doingSignup);

    // TODO catch error signup not allowed

    // TODO catch validation error username contains wrong chars

    let storageRef:StorageRef = Container.get('storage.default');
    let c = await storageRef.connect();
    let users = await c.manager.getRepository(AuthUser).find();
    let methods = await c.manager.getRepository(AuthMethod).find();

    Log.info(users,methods);

  }

}

