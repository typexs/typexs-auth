import *  as passport from 'passport';
import {Config, Inject, RuntimeLoader, ClassesLoader} from 'typexs-base';
import {Action, IApplication, IMiddleware, IRoutingController, K_ROUTE_CONTROLLER} from 'typexs-server';
import {K_LIB_AUTH_ADAPTERS_PASSPORT} from "../types";
import * as _ from 'lodash';


export interface IAuthOptions {
  type: string

  identifier?:string;

  clazz?:Function

}

export interface IAuthConfig {

  userClass?: string | Function

  methods: { [key: string]: IAuthOptions }

}

export interface IAdapterDef {
  name: string;
  moduleName: string;
  className: string;
  filepath: string;
}


export class Passport implements IMiddleware {


  @Inject('RuntimeLoader')
  private loader: RuntimeLoader;

  private authConfig:IAuthConfig;

  private allAdapters: IAdapterDef[] = [];

  private framework: string;


  // support currently only express
  validate(cfg: any): boolean {
    if (cfg.type == 'web' && cfg.framework === 'express') {
      this.framework = cfg.framework;
      return true;
    }
    return false;
  }


  prepare(opts: any) {
    this.authConfig = <IAuthConfig>Config.get('auth');

    let classes = this.loader.getClasses(K_LIB_AUTH_ADAPTERS_PASSPORT);

    for (let cls of classes) {
      let obj = Reflect.construct(cls, []);

      if (obj.name) {
        let def: IAdapterDef = {
          className: cls.name,
          filepath: ClassesLoader.getSource(cls),
          moduleName: ClassesLoader.getModulName(cls),
          name: obj.name
        };

        if(!_.isEmpty(this.authConfig) && !_.isEmpty(this.authConfig.methods)){
          for(let method in this.authConfig.methods){
            let methodOptions = this.authConfig.methods[method];
            methodOptions.identifier = method;
            if(methodOptions.type === obj.name){
              methodOptions.clazz = cls;

            }
          }
        }
        this.allAdapters.push(def);

      }
    }

  }

  getDefinedAdapters():IAdapterDef[] {
    return this.allAdapters;
  }

  getUsedAuthMethods():IAuthOptions[] {
    if(!_.isEmpty(this.authConfig)){
      return _.values(this.authConfig.methods);
    }
    return [];
  }

  extendOptions(options: any) {
    if (options.type === K_ROUTE_CONTROLLER) {
      (<IRoutingController>options).authorizationChecker = this.authorizationChecker.bind(this);
      (<IRoutingController>options).currentUserChecker = this.currentUserChecker.bind(this);
    }
  }


  // (action: Action, roles: any[]) => Promise<boolean> | boolean;
  authorizationChecker(action: Action, roles: any[]): Promise<boolean> | boolean {
    // here you can use request/response objects from action
    // also if decorator defines roles it needs to access the action
    // you can use them to provide granular access check
    // checker must return either boolean (true or false)
    // either promise that resolves a boolean value
    // demo code:
    // const token = action.request.headers["authorization"];
    //
    // const user = await getEntityManager().findOneByToken(User, token);
    // if (user && !roles.length)
    //     return true;
    // if (user && roles.find(role => user.roles.indexOf(role) !== -1))
    //     return true;

    return true;

  }

  // (action: Action) => Promise<any> | any;
  currentUserChecker(action: Action): Promise<any> | any {
    // here you can use request/response objects from action
    // you need to provide a user object that will be injected in controller actions
    // demo code:
    //const token = action.request.headers["authorization"];
    //return getEntityManager().findOneByToken(User, token);
    return null;
  }


  use(app: IApplication): void {
    app.use(passport.initialize());
  }

}
