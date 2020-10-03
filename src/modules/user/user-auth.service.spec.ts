import {getTestBed, TestBed} from '@angular/core/testing';
// import {expect} from 'jasmine';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {UserAuthService} from './user-auth.service';
import {RouterTestingModule} from '@angular/router/testing';
import {BaseModule} from '@typexs/ng-base';
import {API_CTRL_SERVER_PING, API_CTRL_SERVER_ROUTES, IRoute} from '@typexs/server/browser';


/**
 * UserAuthService
 * ---------------
 *
 * - check initialisation of user auth service
 * - check if config was loaded
 * - use session storage for session token
 * - check user logged in
 * - check if permissions are loaded
 * - check if user logout
 * - check sign in
 * - check if menu item can be hidden / shown / are enabled / disable
 * - check no auth support
 *
 */
describe('UserAuthService', () => {
  let service: UserAuthService;
  let injector: TestBed;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        BaseModule],
      providers: [
        UserAuthService
      ]
    });

    injector = getTestBed();
    service = injector.get(UserAuthService);
    httpMock = injector.get(HttpTestingController);

  });


  afterEach(() => {
    httpMock.verify();
  });


  it('should have a service instance and load configuration', () => {
    expect(service).not.toBeNull();

    service.isInitialized().subscribe(x => {
      expect(x).toBeFalse();
    });

    // app backend check calls ping
    const reqPings = httpMock.match('/api' + API_CTRL_SERVER_PING);
    reqPings.map(r => r.flush({time: new Date()}));

    // app backend check calls accessible routes
    const reqRoutes = httpMock.match('/api' + API_CTRL_SERVER_ROUTES);
    reqRoutes.map(r => r.flush(<IRoute[]>[]));

  });


  /*
  it('should handle a simple async scenario', async(() => {
    service.simpleAsync().then((result) => {
      expect(result).toBe('Hi there');
    });
  }));

  it('should work with fakeAsync', fakeAsync(() => {
    let value;
    service.simpleAsync().then((result) => {
      value = result;
    });
    expect(value).not.toBeDefined();

    tick(50);
    expect(value).not.toBeDefined();

    tick(50);
    expect(value).toBeDefined();
  }));
*/
});
