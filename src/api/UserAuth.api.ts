import {AuthDataContainer} from "../libs/auth/AuthDataContainer";
import {AbstractUserSignup} from "../libs/models/AbstractUserSignup";
import {AbstractUserLogin} from "../libs/models/AbstractUserLogin";
import {IAuthUser} from "../libs/models/IAuthUser";
import {IAuthAdapter} from "../libs/adapter/IAuthAdapter";
import {AuthMethod} from "../entities/AuthMethod";

export interface IUserAuthApi {
  onUserCreate?(user: IAuthUser, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>): void;

  onLoginMethod?(method: AuthMethod, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserLogin>): void;
}

export class UserAuthApi implements IUserAuthApi {


  onUserCreate(user: IAuthUser, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserSignup | AbstractUserLogin>) {
  };

  onLoginMethod?(method: AuthMethod, adapter: IAuthAdapter, dataContainer: AuthDataContainer<AbstractUserLogin>): void {
  }


}
