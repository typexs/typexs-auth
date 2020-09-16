import {suite, test} from '@testdeck/mocha';
import {Bootstrap, Log} from '@typexs/base';
import {expect} from 'chai';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {TESTDB_SETTING, TestHelper} from '../TestHelper';
import {IAuthConfig} from '../../../src/libs/auth/IAuthConfig';
import _ = require('lodash');


const OPTIONS: ITypexsOptions = <ITypexsOptions>{
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    // allowSignup: true,
    methods: {
      default: {
        type: 'database',

      }
    }
  },
  modules: {
    paths: [
      __dirname + '/../../..'
    ]
  }
};


let bootstrap: Bootstrap = null;


@suite('functional/database/auth_database_config')
class AuthConfigSpec {

  static before() {
    Log.enable = false;
  }

  static after() {
    Log.enable = true;
  }

  async after() {

    if (bootstrap) {
      await bootstrap.shutdown();
    }
    // await web.stop();
    Bootstrap.reset();
  }

  @test
  async 'global signup forbidden'() {
    const opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = false;
    const ref = await TestHelper.bootstrap_auth('default', opts, [{type: 'system'}], {startup: true});
    bootstrap = ref.bootstrap;
    const auth = ref.auth;

    const adapter = auth.getAdapterByIdentifier('default');
    const r = adapter.canSignup();
    expect(r).to.be.true;

    const signup = auth['canSignup'](adapter);
    expect(signup).to.be.false;
  }


  @test
  async 'adapter signup forbidden'() {
    const opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = false;
    const ref = await TestHelper.bootstrap_auth('default', opts, [{type: 'system'}], {startup: true});
    bootstrap = ref.bootstrap;
    const auth = ref.auth;

    const r = auth.getAdapterByIdentifier('default').canSignup();
    expect(r).to.be.false;
  }

  @test
  async 'global signup allowed, but not from adapter'() {
    const opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = true;
    // (<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = false;
    const ref = await TestHelper.bootstrap_auth('default', opts, [{type: 'system'}], {startup: true});
    bootstrap = ref.bootstrap;
    const auth = ref.auth;

    expect(auth.config().allowSignup).to.be.true;

    const adapter = auth.getAdapterByIdentifier('default');

    let r = adapter.canSignup();
    expect(r).to.be.false;

    r = auth['canSignup'](adapter);
    expect(r).to.be.false;


  }


  @test
  async 'global and adapter signup allowed '() {
    const opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = true;
    (<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = true;
    const ref = await TestHelper.bootstrap_auth('default', opts, [{type: 'system'}], {startup: true});
    const auth = ref.auth;
    bootstrap = ref.bootstrap;

    expect(auth.config().allowSignup).to.be.true;

    const adapter = auth.getAdapterByIdentifier('default');
    let r = adapter.canSignup();
    expect(r).to.be.true;

    r = auth['canSignup'](adapter);
    expect(r).to.be.true;


  }

}
