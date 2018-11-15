import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, Log} from "@typexs/base";
import {expect} from 'chai';
import {Auth} from "../../../src/middleware/Auth";
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";



let bootstrap: Bootstrap = null;

let auth: Auth = null;

@suite('functional/auth_database_config')
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
    bootstrap = Bootstrap.setConfigSources([{type:'system'}])
      .configure(<ITypexsOptions>{
        auth: {
          methods: {
            default: {
              type: 'database',
              allowSignup: false
            }
          }
        }
      });

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();

    auth = Container.get(Auth);
    await auth.prepare();

    let r = auth.getAdapterByIdentifier('default').canSignup();
    expect(r).to.be.false;
  }

  @test
  async 'global signup allowed, but not from adapter'() {
    bootstrap = Bootstrap.setConfigSources([{type:'system'}])
      .configure(<ITypexsOptions>{
        storage:{
          default:{
            synchronize: true,
            type: 'sqlite',
            database: ':memory:'
          }
        },
        auth: {
          allowSignup: true,
          methods: {
            default: {
              type: 'database',

            }
          }
        }
      });
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
    bootstrap = Bootstrap.setConfigSources([{type:'system'}])
      .configure(<ITypexsOptions>{
        storage:{},
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
