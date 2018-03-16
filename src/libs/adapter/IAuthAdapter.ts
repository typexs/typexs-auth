import {IAuthOptions} from "../auth/IAuthOptions";
import {AuthLifeCycle} from "../../types";
import {AuthMethod} from "../../entities/AuthMethod";

import {AbstractUserSignup} from "../models/AbstractUserSignup";
import {AbstractInputData} from "../models/AbstractInputData";
import {AuthUser} from "../../entities/AuthUser";

export interface IAuthAdapter {

  type: string;

  authId?: string;

  hasRequirements?(): boolean;

  prepare(authOptions: IAuthOptions): void;

//  beforeUse?(app: IApplication): void;

//  afterUse?(app: IApplication): void;

  getModelFor(stage: AuthLifeCycle): Function;

  authenticate(login: any): Promise<boolean> | boolean;

  // getAuth(login: any): Promise<AuthMethod>;
  canCreateOnLogin(): boolean;

  canSignup(): boolean;

  signup?(signup:AbstractUserSignup): boolean;



  extend(obj:AuthUser | AuthMethod, data: AbstractInputData):void;

}
