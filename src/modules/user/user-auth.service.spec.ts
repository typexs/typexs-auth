import {getTestBed, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {UserAuthService} from './user-auth.service';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService, BackendService, BaseModule, HttpBackendService} from '@typexs/ng-base';
import {API_CTRL_SERVER_PING, API_CTRL_SERVER_ROUTES, IRoute} from '@typexs/server/browser';
import {API_USER, API_USER_CONFIG, API_USER_IS_AUTHENTICATED} from '../../libs/Constants';
import {IAuthMethodInfo} from '../../libs/auth/IAuthMethodInfo';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {AuthTokenInterceptor} from './authtoken.interceptor';
import {User} from '../../entities/User';


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
  let backService: HttpBackendService;
  let injector: TestBed;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        BaseModule
      ],
      providers: [
        {provide: BackendService, useClass: HttpBackendService},
        {provide: AuthService, useClass: UserAuthService},
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthTokenInterceptor,
          multi: true
        }
      ]
    });

    injector = getTestBed();
    backService = injector.get(BackendService);

    service = injector.get(AuthService);
    httpMock = injector.get(HttpTestingController);

  });


  afterEach(() => {
    httpMock.verify();
  });


  it('should have a service instance and not be initialised', () => {
    expect(service).not.toBeNull();

    service.isInitialized().subscribe(x => {
      expect(x).toBeFalse();
    });

    // app backend check calls ping
    const reqPings = httpMock.expectOne('/api' + API_CTRL_SERVER_PING);
    reqPings.flush({time: new Date()});

    // app backend check calls accessible routes
    const reqRoutes = httpMock.expectOne('/api' + API_CTRL_SERVER_ROUTES);
    reqRoutes.flush(<IRoute[]>[]);

  });


  it('check successfully initialise with no auth', done => {

    service.init()
      .subscribe(x => {
        if (x) {
          done();
        }
      }, error => {
        console.error(error);
      });


    // app backend check calls ping
    const reqPings = httpMock.expectOne(backService.apiUrl(API_CTRL_SERVER_PING));
    reqPings.flush({time: new Date()});

    // app backend check calls accessible routes
    const reqRoutes = httpMock.match(backService.apiUrl(API_CTRL_SERVER_ROUTES));
    reqRoutes.map(x => x.flush(<IRoute[]>[
        // reqRoutes.flush([
        {
          route: backService.apiUrl(API_CTRL_SERVER_PING),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_CTRL_SERVER_ROUTES),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_USER_CONFIG),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_USER_IS_AUTHENTICATED),
          method: 'get',
          context: 'api',
          authorized: false
        }
      ])
    );

    const reqCfg = httpMock.expectOne(backService.apiUrl(API_USER_CONFIG));
    reqCfg.flush({
      enabled: true,
      authKey: 'txs',
      methods: <IAuthMethodInfo[]>[]
    });

    const reqAuth = httpMock.expectOne(backService.apiUrl(API_USER_IS_AUTHENTICATED));
    reqAuth.flush('false');

  });


  it('check successfully initialise with auth', done => {
    // localStorage.setItem('token.txs', 'hallo_token');

    service.init()
      .subscribe(x => {
        if (x) {
          done();
        }
      }, error => {
        console.error(error);
      });


    // app backend check calls ping
    const reqPings = httpMock.expectOne(backService.apiUrl(API_CTRL_SERVER_PING));
    reqPings.flush({time: new Date()});

    // app backend check calls accessible routes
    const reqRoutes = httpMock.match(backService.apiUrl(API_CTRL_SERVER_ROUTES));
    reqRoutes.map(x => x.flush(<IRoute[]>[
        // reqRoutes.flush([
        {
          route: backService.apiUrl(API_CTRL_SERVER_PING),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_CTRL_SERVER_ROUTES),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_USER_CONFIG),
          method: 'get',
          context: 'api',
          authorized: false
        },
        {
          route: backService.apiUrl(API_USER_IS_AUTHENTICATED),
          method: 'get',
          context: 'api',
          authorized: false
        }
      ])
    );

    const reqCfg = httpMock.expectOne(backService.apiUrl(API_USER_CONFIG));
    reqCfg.flush({
      enabled: true,
      authKey: 'txs',
      methods: <IAuthMethodInfo[]>[]
    });

    const reqAuth = httpMock.expectOne(backService.apiUrl(API_USER_IS_AUTHENTICATED));
    reqAuth.flush('true');


    // app backend check calls accessible routes
    const reqAccessRoute = httpMock.expectOne(backService.apiUrl(API_CTRL_SERVER_ROUTES));
    reqAccessRoute.flush(<IRoute[]>[
      // reqRoutes.flush([
      {
        route: backService.apiUrl(API_CTRL_SERVER_PING),
        method: 'get',
        context: 'api',
        authorized: false
      },
      {
        route: backService.apiUrl(API_CTRL_SERVER_ROUTES),
        method: 'get',
        context: 'api',
        authorized: false
      },
      {
        route: backService.apiUrl(API_USER_CONFIG),
        method: 'get',
        context: 'api',
        authorized: false
      },
      {
        route: backService.apiUrl(API_USER_IS_AUTHENTICATED),
        method: 'get',
        context: 'api',
        authorized: false
      },
      {
        route: backService.apiUrl(API_USER),
        method: 'get',
        context: 'api',
        authorized: true
      }
    ])
    ;

    const reqUserData = httpMock.expectOne(backService.apiUrl(API_USER));
    reqUserData.flush(<User>{id: 1, username: 'bestuser'});

  });

});
