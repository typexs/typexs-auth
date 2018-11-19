import {Container, Inject, RuntimeLoader} from "@typexs/base";
import {K_LIB_AUTH_CONFIGURATIONS} from "../../types";
import {IAuthConfiguration} from "./IAuthConfiguration";
import * as _ from "lodash";


export interface IAuthConfigurationDef {
  id: string;
  cls: Function;
}

export class AuthConfigurationFactory {

  @Inject('RuntimeLoader')
  private loader: RuntimeLoader;

  private configurations: IAuthConfigurationDef[] = [];


  initialize() {
    Container.set("AuthConfigurationFactory", this);
    let classes = this.loader.getClasses(K_LIB_AUTH_CONFIGURATIONS);

    for (let cls of classes) {
      let adapterInstance = <IAuthConfiguration>Container.get(cls);
      let cfg: IAuthConfigurationDef = {
        id: adapterInstance.id,
        cls: cls
      };
      this.configurations.push(cfg);
    }
  }


  get(id: string) {
    let cfg = _.find(this.configurations,{id:id});
    if(cfg){
      return <IAuthConfiguration>Container.get(cfg.cls);
    }
    return null;

  }
}
