import {IUser} from "@typexs/ng-base/libs/api/auth/IUser";

export interface IAuthUser extends IUser {

  id?: number;


  disabled?: boolean;


}
