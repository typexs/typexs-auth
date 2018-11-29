import {ISessionOptions} from "./ISessionOptions";
import {IAuthOptions} from "./IAuthOptions";
import {IConfigUser} from "../models/IConfigUser";
import {IConfigRole} from "../models/IConfigRole";


export interface IAuthConfig {

  // backend for user accounts
  //backend?:string;

  httpAuthKey?: string;

  allowSignup?: boolean;

  saltRounds?: number;

  session?: ISessionOptions;

  userClass?: string | Function

  initUsers?: IConfigUser[]

  initRoles?: IConfigRole[]

  chain?: string[];

  methods?: { [key: string]: IAuthOptions }

}
