import {suite, test} from "mocha-typescript";
import {Bootstrap, Container, Log} from "@typexs/base";
import {expect} from 'chai';
import {ITypexsOptions} from "@typexs/base/libs/ITypexsOptions";
import {TESTDB_SETTING, TestHelper} from "../TestHelper";
import {IAuthConfig} from "../../../src/libs/auth/IAuthConfig";
import _ = require("lodash");


const OPTIONS: ITypexsOptions = <ITypexsOptions>{
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    //allowSignup: true,
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

    if(bootstrap){
      await bootstrap.shutdown();
    }
    // await web.stop();
    Bootstrap.reset();
    Container.reset();
  }

  @test
  async 'global signup forbidden'() {
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = false;
    let ref = await TestHelper.bootstrap_auth('default', opts, [{type: 'system'}], {startup: false});
    bootstrap = ref.bootstrap;
    let auth = ref.auth;

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
    let ref = await TestHelper.bootstrap_auth('default', opts,[{type: 'system'}], {startup: false});
    bootstrap = ref.bootstrap;
    let auth = ref.auth;

    let r = auth.getAdapterByIdentifier('default').canSignup();
    expect(r).to.be.false;
  }

  @test
  async 'global signup allowed, but not from adapter'() {
    let opts = _.clone(OPTIONS);
    opts.storage = {};
    (<IAuthConfig>(<any>opts).auth).allowSignup = true;
    //(<IAuthConfig>(<any>opts).auth).methods.default.allowSignup = false;
    let ref = await TestHelper.bootstrap_auth('default', opts,[{type: 'system'}], {startup: false});
    bootstrap = ref.bootstrap;
    let auth = ref.auth;

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
    let ref = await TestHelper.bootstrap_auth('default', opts,[{type: 'system'}], {startup: false});
    let auth = ref.auth;
    bootstrap = ref.bootstrap;

    expect(auth.config().allowSignup).to.be.true;

    let adapter = auth.getAdapterByIdentifier('default');
    let r = adapter.canSignup();
    expect(r).to.be.true;

    r = auth['canSignup'](adapter);
    expect(r).to.be.true;



  }

}
