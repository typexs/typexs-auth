import {ISessionOptions} from './ISessionOptions';
import {IAuthOptions} from './IAuthOptions';


export interface IAuthConfig {

  // backend for user accounts
  // backend?:string;

  httpAuthKey?: string;

  allowSignup?: boolean;

  saltRounds?: number;

  session?: ISessionOptions;

  userClass?: string | Function;


  chain?: string[];

  methods?: { [key: string]: IAuthOptions };

}
