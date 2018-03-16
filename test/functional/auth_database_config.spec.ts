import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, ITypexsOptions, Log} from "typexs-base";
import {expect} from 'chai';
import {Auth} from "../../src/middleware/Auth";
import {DefaultUserSignup} from "../../src/libs/models/DefaultUserSignup";

let bootstrap: Bootstrap = null;

let auth: Auth = null;

@suite('functional/auth_database_errors')
class AuthConfigSpec {

  static before(){
    Log.enable = false;
  }

  static after(){
    Log.enable = true;
  }

  after() {
    // await web.stop();
    Bootstrap.reset();
  }


  @test
  async 'signup forbidden'() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
        auth: {
          methods: {
            default: {
              type: 'database',
              // allowSignup: true
            }
          }
        }
      })

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();

    let r = auth.getAdapterByIdentifier('default').canSignup();
    expect(r).to.be.false;
  }

  @test
  async 'global signup allowed, but not from adapter'() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
        auth: {
          allowSignup: true,
          methods: {
            default: {
              type: 'database',
              // allowSignup: true
            }
          }
        }
      })

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();

    expect(auth.config().allowSignup).to.be.true;

    let adapter = auth.getAdapterByIdentifier('default');

    let r = adapter.canSignup();
    expect(r).to.be.false;

    r = auth['canSignup'](adapter);
    expect(r).to.be.false;

  }


  @test
  async 'global and adapter signup allowed '() {
    bootstrap = Bootstrap
      .configure(<ITypexsOptions>{
        auth: {
          // allowSignup: true,
          methods: {
            default: {
              type: 'database',
              allowSignup: true
            }
          }
        }
      })

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();
    expect(auth.config().allowSignup).to.be.true;

    let adapter = auth.getAdapterByIdentifier('default');
    let r = adapter.canSignup();
    expect(r).to.be.true;

    r = auth['canSignup'](adapter);
    expect(r).to.be.true;

  }

}

