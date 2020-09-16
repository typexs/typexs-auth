import {IAuthUser} from './IAuthUser';


export interface IConfigUser extends IAuthUser {
  password: string;

  adapter: string;

  roles?: string[];
}
