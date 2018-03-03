import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import * as _ from 'lodash';
import * as request from 'supertest';

import {ServerRegistry, WebServer, K_ROUTE_CONTROLLER, C_DEFAULT} from "typexs-server";
import {
  Bootstrap,
  Config,
  IFileConfigOptions,
  PlatformUtils,
  FileUtils,
  ClassesLoader,
  Container,
  RuntimeLoader
} from "typexs-base";

import {IAuthConfig, Auth} from "../../src/middleware/Passport";
import {AuthUser} from "../../src/entities/AuthUser";


@suite('functional/auth_config')
class AuthConfigSpec {


  before() {
    Config.clear();

  }


  after() {
    Config.clear();
  }

  @test
  async 'auth config'() {
    let auth:IAuthConfig = {
      userClass: AuthUser, // ./User as string
      methods:{
        default:{
          type:'database'
        }
      }
    };

    let json = FileUtils.getJsonSync(__dirname + '/../../package.json');
    let loader = new RuntimeLoader({
      appdir: PlatformUtils.pathResolve('.'),
      libs: json.typexs.declareLibs
    });

    await loader.prepare();
    Container.set("RuntimeLoader", loader);
    Config.set('auth',auth);

    let passport = Container.get(Auth);
    await passport.prepare({});

    let adapters = passport.getDefinedAdapters();
    let authMethods = passport.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.deep.eq(['database']);
    expect(adapters.map(x => x.className)).to.deep.eq(['DatabaseAdapter']);
    expect(authMethods.map(x => x.identifier)).to.deep.eq(['default']);

  }
}

