import {getTestBed, TestBed} from '@angular/core/testing';
import {AuthUserService} from "./user.service";
import {expect} from 'chai';
import {HttpClientModule} from "@angular/common/http";
import {Observable} from "rxjs/Observable";



describe('AuthUserService', () => {
  let service: AuthUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientModule],
      providers: [AuthUserService]
    });
  });

  afterEach(() => {
    getTestBed().resetTestingModule();
  });


  it('should have a service instance and load configuration', (done) => {
    // inject the service
    service = TestBed.get(AuthUserService);
    expect(service).to.exist;
    expect(service.isInitialized()).to.be.false;


    setTimeout(() => {
      expect(service.isInitialized()).to.be.true;
      expect(service).to.exist;
      done()

    },200);

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
