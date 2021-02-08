import {ClassesLoader, Config, Inject, Injector, Log, RuntimeLoader} from '@typexs/base';
import {CryptUtils} from '@allgemein/base';

import {K_LIB_AUTH_ADAPTERS, K_LIB_AUTH_CONFIGURATIONS} from '../Constants';
import {IAuthConfiguration} from '../adapter/IAuthConfiguration';
import * as _ from 'lodash';
import {IAuthConfigurationDef} from './IAuthConfigurationDef';
import {IAuthConfig} from './IAuthConfig';
import {User} from '../../entities/User';
import {IAuthAdapter} from '../adapter/IAuthAdapter';
import {IAdapterDef} from '../adapter/IAdapterDef';


const DEFAULT_CONFIG_OPTIONS: IAuthConfig = {
  // backend: 'default',
  httpAuthKey: 'txs-auth',
  allowSignup: true,
  saltRounds: 5,
  userClass: User,


  session: {
    secret: CryptUtils.shorthash(new Date() + ''),
    resave: true,
    saveUninitialized: true
  }
};


export class AuthManager {

  static NAME = 'AuthManager';

  @Inject('RuntimeLoader')
  private loader: RuntimeLoader;

  private authConfig: IAuthConfig;

  private configurations: IAuthConfigurationDef[] = [];

  private allAdapters: IAdapterDef[] = [];

  private adapters: IAuthAdapter[] = [];

  private enabled = false;


  initialize() {
    Injector.set('AuthManager', this);
    const x = Config.get('auth', {});
    this.authConfig = <IAuthConfig>x;
    _.defaultsDeep(this.authConfig, DEFAULT_CONFIG_OPTIONS);

    this.enabled = !_.isEmpty(this.authConfig) && _.keys(this.authConfig.methods).length > 0;
  }

  async prepare() {
    await this.initConfigurations();
    await this.initAdapter();
  }


  getDefinedAdapters() {
    return this.allAdapters;
  }

  private initConfigurations() {

    const classes = this.loader.getClasses(K_LIB_AUTH_CONFIGURATIONS);

    for (const cls of classes) {
      const adapterInstance = <IAuthConfiguration>Injector.get(cls);
      const cfg: IAuthConfigurationDef = {
        id: adapterInstance.id,
        cls: cls
      };
      this.configurations.push(cfg);
    }
  }

  private async initAdapter() {

    const classes = this.loader.getClasses(K_LIB_AUTH_ADAPTERS);

    for (const cls of classes) {
      const authAdapter = <IAuthAdapter>Reflect.construct(cls, []);

      if (!authAdapter.hasRequirements()) {
        Log.error('Can\'t load adapter ' + authAdapter.type + '! Skipping ... ');
        continue;
      }

      if (authAdapter.type) {
        const def: IAdapterDef = {
          className: cls.name,
          filepath: ClassesLoader.getSource(cls),
          moduleName: ClassesLoader.getModulName(cls),
          name: authAdapter.type
        };

        if (!_.isEmpty(this.authConfig) && !_.isEmpty(this.authConfig.methods)) {
          for (const authId in this.authConfig.methods) {
            if (this.authConfig.methods.hasOwnProperty(authId)) {
              const methodOptions = this.authConfig.methods[authId];
              methodOptions.authId = authId;
              if (methodOptions.type === authAdapter.type) {
                methodOptions.clazz = cls;

                if (authAdapter.updateOptions) {
                  authAdapter.updateOptions(methodOptions);
                }

                const adapterInstance = <IAuthAdapter>Injector.create(cls);
                adapterInstance.authId = authId;
                this.adapters.push(adapterInstance);
                await adapterInstance.prepare(methodOptions);
              }
            }
          }
        }
        this.allAdapters.push(def);
      }
    }

  }


  getAdapter(authId: string) {
    return _.find(this.adapters, a => a.authId === authId);
  }

  getAdapters() {
    return this.adapters;
  }


  isEnabled() {
    return this.enabled;
  }


  getConfiguration(id: string) {
    const cfg = _.find(this.configurations, {id: id});
    if (cfg) {
      return <IAuthConfiguration>Injector.get(cfg.cls);
    }
    return null;

  }

  getConfig() {
    return this.authConfig;
  }

}
