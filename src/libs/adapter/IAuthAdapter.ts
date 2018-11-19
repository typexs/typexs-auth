import {IAuthOptions} from "../auth/IAuthOptions";
import {AuthLifeCycle} from "../../types";
import {AuthMethod} from "../../entities/AuthMethod";

import {AbstractUserSignup} from "../models/AbstractUserSignup";


import {AbstractUserLogin} from "../models/AbstractUserLogin";
import {IApplication, IRequest, IResponse} from "@typexs/server";
import {User} from "../../entities/User";
import {AuthDataContainer} from "../auth/AuthDataContainer";


export type T_AUTH_ADAPTER_STAGE = 'before' | 'after'

export interface IAuthAdapter {

  type: string;

  authId?: string;

  hasRequirements?(): boolean;

  prepare(authOptions: IAuthOptions): void;

//  beforeUse?(app: IApplication): void;

//  afterUse?(app: IApplication): void;



  use?(app: IApplication, stage?: T_AUTH_ADAPTER_STAGE): void;

  getModelFor(stage: AuthLifeCycle): Function;

  authenticate<T>(login: AuthDataContainer<T>): Promise<boolean> | boolean;

  // getAuth(login: any): Promise<AuthMethod>;
  canCreateOnLogin(): boolean;

  canSignup(): boolean;

  signup?(signup: AuthDataContainer<AbstractUserSignup>): boolean;


  createOnLogin?(login: AuthDataContainer<AbstractUserLogin>): boolean;


  handleCallback?(req: IRequest, res: IResponse): void;

  handleRedirect?(req: IRequest, res: IResponse): void;

  /**
   * Add additional information if necessary
   *
   * @param options
   */
  updateOptions?(options: IAuthOptions): void;


  extend(obj: User | AuthMethod, data: any): void;

}
