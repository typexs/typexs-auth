import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, Log} from "@typexs/base";
import {expect} from 'chai';
import {Auth} from "../../../src/middleware/Auth";
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";
import {TestHelper} from "../TestHelper";
import _ = require("lodash");
import {IAuthOptions} from "../../../src/libs/auth/IAuthOptions";
import {IAuthConfig} from "../../../src/libs/auth/IAuthConfig";


let auth: Auth = null;

const OPTIONS: ITypexsOptions = <ITypexsOptions>{
  storage: {
    default: {
      synchronize: true,
      type: 'sqlite',
      database: ':memory:'
    }
  },
  auth: {
    //allowSignup: true,
    methods: {
      default: {
        type: 'database',

      }
    }
  }
}

@suite('functional/auth_database_config')
class AuthConfigSpec {

  static before() {
    Log.enable = false;
  }

  static after() {
    Log.enable = true;
  }

  after() {
    // await web.stop();
    Bootstrap.reset();
    Container.reset();
  }

  @test
  async 'global signup forbidden'() {
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = false;
    await TestHelper.bootstrap_basic(opts);

    auth = Container.get(Auth);
    await auth.prepare();
    let adapter = auth.getAdapterByIdentifier('default');
    let r = adapter.canSignup();
    expect(r).to.be.true;

    let signup = auth['canSignup'](adapter);
    expect(signup).to.be.false;
  }


  @test
  async 'adapter signup forbidden'() {
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = false;
    await TestHelper.bootstrap_basic(opts);

    auth = Container.get(Auth);
    await auth.prepare();
    let r = auth.getAdapterByIdentifier('default').canSignup();
    expect(r).to.be.false;
  }

  @test
  async 'global signup allowed, but not from adapter'() {
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = true;
    //(<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = false;
    await TestHelper.bootstrap_basic(opts);

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
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = true;
    (<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = true;
    await TestHelper.bootstrap_basic(opts);

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
