import {suite, test} from "mocha-typescript";
import {expect} from 'chai';
import * as _ from 'lodash';
import * as request from 'supertest';

import {ServerRegistry,WebServer,K_ROUTE_CONTROLLER,C_DEFAULT} from "typexs-server";
import {Bootstrap, Config, IFileConfigOptions, PlatformUtils, ClassesLoader, Container,RuntimeLoader} from "typexs-base";


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

    // Dummy storage entry for auth
    Container.set("storage.default", {});

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

