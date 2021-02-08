import * as _ from 'lodash';
import {DataContainer} from '@typexs/base/browser';
import {EntityRegistry} from '@typexs/schema';
export const STATE_KEY = '$state';
export class AuthDataContainer<T> extends DataContainer<T> {

  // authId: string;

  isAuthenticated?: boolean = false;

  success: boolean = false;

  method?: any;

  token?: string;

  user?: any;

  data?: any;

  constructor(instance: T) {
    super(instance, EntityRegistry.$());
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
