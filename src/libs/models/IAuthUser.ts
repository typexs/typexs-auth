import {IUser} from '@typexs/ng/browser';

export interface IAuthUser extends IUser {

  id?: number;


  disabled?: boolean;

  approved?: boolean;


}
