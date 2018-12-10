import {UseAPI} from "@typexs/base/decorators/UseAPI";
import {IUserAuthApi, UserAuthApi} from "../../../api/UserAuth.api";
import {IAuthAdapter} from "../../../libs/adapter/IAuthAdapter";
import {AuthDataContainer} from "../../../libs/auth/AuthDataContainer";
import {AbstractUserSignup} from "../../../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../../../libs/models/AbstractUserLogin";
import {AuthMethod} from "../../../entities/AuthMethod";
import {DefaultUserSignup} from "../../../libs/models/DefaultUserSignup";
import {DatabaseAdapter} from "./DatabaseAdapter";

@UseAPI(UserAuthApi)
export class DatabaseUserAuthExtenstion implements IUserAuthApi {


  async onLoginMethod(method: AuthMethod, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>): Promise<void> {
    if(adapter instanceof DatabaseAdapter){
      if (method instanceof AuthMethod && dataContainer.instance instanceof DefaultUserSignup) {
        method.secret = dataContainer.instance.password ? await adapter.crypt(dataContainer.instance.password) : null;
      }
    }
  }

}
