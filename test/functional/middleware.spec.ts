import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';

import {C_DEFAULT, K_ROUTE_CONTROLLER, WebServer} from '@typexs/server';
import {Bootstrap, Injector, PlatformUtils} from '@typexs/base';
import {AuthManager} from '../../src/libs/auth/AuthManager';
import {TestHelper} from './TestHelper';

let bootstrap: Bootstrap;

@suite('functional/middleware')
class MiddlewareSpec {

  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }
  }

  @test
  async 'inject middleware in express'() {

    bootstrap = await TestHelper.bootstrap_basic({
      modules: {
        appdir: PlatformUtils.pathResolve('.'),
        libs: [
          {
            'topic': 'server.middleware',
            'refs': [
              'src/middleware',
            ]
          }]
      }
    });

    //
    // const loader = new RuntimeLoader({});
    //
    //
    // await loader.prepare();
    // Container.set('RuntimeLoader', loader);
    // const invoker = new Invoker();
    // Bootstrap.prepareInvoker(invoker, loader);
    //
    // Container.set(Invoker.NAME, invoker);
    //
    // // Dummy storage entry for auth
    // Container.set('storage.default', {
    //   connect: function () {
    //   }
    // });
    // Container.set('EntityController.default', {});


    const manager = Injector.get(AuthManager);
    Injector.set(AuthManager.NAME, manager);
    await manager.prepare();


    const web = <WebServer>Injector.get(WebServer);
    await web.initialize({
      type: 'web',
      framework: 'express',
      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: C_DEFAULT
      }]
    });

    await web.prepare();

    const middlewares = web.middlewares();

    const uri = web.getUri();
    const routes = web.getRoutes();

    const started = await web.start();

    expect(started).to.be.true;
    // let res = await request(uri).get('/get').expect(200);
    const stopped = await web.stop();
    expect(stopped).to.be.true;
    expect(middlewares).to.have.length(1);
    /*
    expect(stopped).to.be.true;
    expect(res.body).to.deep.eq({json: 'test'});
    expect(routes).to.deep.eq([
      {
        "context": "default",
        "route": "/get",
        "method": "get"
      }
    ]);
  */


  }
}

