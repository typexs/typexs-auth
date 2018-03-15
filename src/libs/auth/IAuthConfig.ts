import {ISessionOptions} from "./ISessionOptions";
import {IAuthOptions} from "./IAuthOptions";


export interface IAuthConfig {

  httpAuthKey?: string;

  allowRegistration: true;

  saltRounds?: number;

  session?: ISessionOptions;

  userClass?: string | Function

  chain?: string[];

  methods?: { [key: string]: IAuthOptions }

}
