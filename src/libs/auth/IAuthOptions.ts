import {IAuthMethodInfo} from './IAuthMethodInfo';

export interface IAuthOptions extends IAuthMethodInfo {


  authId?: string;

  serverside?: boolean;


  approval?: {
    auto?: boolean,
    notify?: string[]
  };

  role?: string;

  clazz?: Function;

  /**
   * Create automatically a local account when authentication succeed.
   */
  createOnLogin?: boolean;

  /**
   * Allow signup for this adapter if it is supported
   */
  allowSignup?: boolean;

  /**
   * Name keys which must be passed to the frontend
   */
  passKeys?: string[];

}
