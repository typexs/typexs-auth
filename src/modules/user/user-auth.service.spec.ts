import {getTestBed, TestBed} from '@angular/core/testing';
import {expect} from 'chai';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {UserAuthService} from './user-auth.service';
import {RouterTestingModule} from '@angular/router/testing';
import {BaseModule} from '@typexs/ng-base';


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
  });


  afterEach(() => {
    getTestBed().resetTestingModule();
  });


  it('should have a service instance and load configuration', () => {
    // inject the service
    const httpMock = TestBed.get(HttpTestingController);
    service = TestBed.get(UserAuthService);
    expect(service).to.exist;


    service.isInitialized().subscribe(x => {
      expect(x).to.be.false;
    });

    // const mockReq = httpMock.expectOne(service.url);

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
