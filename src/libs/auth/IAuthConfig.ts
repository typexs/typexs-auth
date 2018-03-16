import {ISessionOptions} from "./ISessionOptions";
import {IAuthOptions} from "./IAuthOptions";


export interface IAuthConfig {

  httpAuthKey?: string;

  allowSignup?: boolean;

  saltRounds?: number;

  session?: ISessionOptions;

  userClass?: string | Function

  chain?: string[];

  methods?: { [key: string]: IAuthOptions }

}
