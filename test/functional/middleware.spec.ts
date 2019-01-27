import {suite, test} from "mocha-typescript";
import {expect} from 'chai';

import {C_DEFAULT, K_ROUTE_CONTROLLER, WebServer} from "@typexs/server";
import {Bootstrap, Container, Invoker, PlatformUtils, RuntimeLoader} from "@typexs/base";
import {AuthManager} from "../../src/libs/auth/AuthManager";


@suite('functional/middleware')
class MiddlewareSpec {


  before() {
    Bootstrap.reset();
  }


  after() {
    Bootstrap.reset();
  }


  @test
  async 'inject middleware in express'() {

    let loader = new RuntimeLoader({
      appdir: PlatformUtils.pathResolve('.'),
      libs: [
        {
          "topic": "server.middleware",
          "refs": [
            "src/middleware",
          ]
        }]
    });


    await loader.prepare();
    Container.set("RuntimeLoader", loader);
    let invoker = new Invoker();
    Bootstrap.prepareInvoker(invoker, loader);

    Container.set(Invoker.NAME, invoker);

    // Dummy storage entry for auth
    Container.set("storage.default", {connect:function(){}});
    Container.set("EntityController.default", {});


    let manager = Container.get(AuthManager);
    Container.set(AuthManager.NAME, manager);
    await manager.prepare();


    let web = <WebServer>Container.get(WebServer);
    await web.initialize({
      type: 'web',
      framework: 'express',
      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: C_DEFAULT
      }]
    });

    await web.prepare();

    let middlewares = web.middlewares();

    let uri = web.getUri();
    let routes = web.getRoutes();

    let started = await web.start();

    expect(started).to.be.true;
    //let res = await request(uri).get('/get').expect(200);
    let stopped = await web.stop();
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

