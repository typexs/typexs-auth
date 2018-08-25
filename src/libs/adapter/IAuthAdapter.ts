import {IAuthOptions} from "../auth/IAuthOptions";
import {AuthLifeCycle} from "../../types";
import {AuthMethod} from "../../entities/AuthMethod";

import {AbstractUserSignup} from "../models/AbstractUserSignup";
import {AbstractInputData} from "../models/AbstractInputData";
import {AuthUser} from "../../entities/AuthUser";
import {AbstractUserLogin} from "../models/AbstractUserLogin";
import {IApplication, IRequest, IResponse} from "typexs-server";


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

  authenticate(login: any): Promise<boolean> | boolean;

  // getAuth(login: any): Promise<AuthMethod>;
  canCreateOnLogin(): boolean;

  canSignup(): boolean;

  signup?(signup: AbstractUserSignup): boolean;


  createOnLogin?(login: AbstractUserLogin): boolean;


  handleCallback?(req: IRequest, res: IResponse): void;

  handleRedirect?(req: IRequest, res: IResponse): void;

  /**
   * Add additional information if necessary
   *
   * @param options
   */
  updateOptions?(options: IAuthOptions): void;


  extend(obj: AuthUser | AuthMethod, data: AbstractInputData): void;

}
