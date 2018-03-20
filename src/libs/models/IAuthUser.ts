import {AuthMethod} from "../../entities/AuthMethod";


export interface IAuthUser {
  id: number;

  username: string;

  mail: string;

  disabled: boolean;

  created_at: Date;

  updated_at: Date;

}
