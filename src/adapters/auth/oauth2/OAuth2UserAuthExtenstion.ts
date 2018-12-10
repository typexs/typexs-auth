import * as _ from 'lodash';
import {UseAPI} from "@typexs/base/decorators/UseAPI";
import {IUserAuthApi, UserAuthApi} from "../../../api/UserAuth.api";
import {IAuthAdapter} from "../../../libs/adapter/IAuthAdapter";
import {AuthDataContainer} from "../../../libs/auth/AuthDataContainer";
import {AbstractUserSignup} from "../../../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../../../libs/models/AbstractUserLogin";
import {AuthMethod} from "../../../entities/AuthMethod";
import {OAuth2Adapter} from "./OAuth2Adapter";
import {IAuthUser} from "../../../libs/models/IAuthUser";


@UseAPI(UserAuthApi)
export class OAuth2UserAuthExtenstion implements IUserAuthApi {


  async onLoginMethod(method: AuthMethod, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>): Promise<void> {
    if (adapter instanceof OAuth2Adapter) {
      let user = _.get(dataContainer, '_user');
      let info = _.get(dataContainer, '_info');
      if (!method.mail) {
        method.mail = user.mail;
      }
      if (!method.data) {
        method.data = {}
      }
      method.data = _.merge(method.data, info);
    }
  }

  async onUserCreate(user: IAuthUser, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>): Promise<void> {
    if (adapter instanceof OAuth2Adapter) {
      let _user = _.get(dataContainer, '_user');
      (<any>user).displayName = _user.displayName;
      user.mail = _user.mail;
    }
  }

}
