import {getTestBed, TestBed} from '@angular/core/testing';
import {UserAuthServiceProvider} from "./user-auth-service-provider.service";
import {expect} from 'chai';
import {HttpClientModule} from "@angular/common/http";
import {Observable} from "rxjs/Observable";



describe('UserAuthServiceProvider', () => {
  let service: UserAuthServiceProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientModule],
      providers: [UserAuthServiceProvider]
    });
  });

  afterEach(() => {
    getTestBed().resetTestingModule();
  });


  it('should have a service instance and load configuration', () => {
    // inject the service
    service = TestBed.get(UserAuthServiceProvider);
    expect(service).to.exist;
    expect(service.isInitialized()).to.be.false;



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
