import {DataContainer, STATE_KEY} from "@typexs/schema/libs/DataContainer";
import * as _ from 'lodash'

export class AuthDataContainer<T> extends DataContainer<T> {

  //authId: string;

  isAuthenticated?: boolean = false;

  success: boolean = false;

  method?: any;

  token?: string;

  user?: any;

  data?: any;


  constructor(instance: T) {
    //sdf

    super(instance);
  }

  applyState(): void {
    super.applyState();

    ['isAuthenticated', 'success', 'method', 'token', 'user', 'data'].forEach(k => {
      const value = _.get(this, k, null);
      if (_.isBoolean(value) || !_.isEmpty(value)) {
        _.set(<any>this.instance, [STATE_KEY, k].join('.'), value);
      }
    });

  }

}
