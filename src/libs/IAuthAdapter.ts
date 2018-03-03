import {IAuthOptions} from "../middleware/Auth";
import {IApplication} from "typexs-server";
import * as passport from "passport";
import {AuthLifeCycle} from "../types";
import {AuthMethod} from "../entities/AuthMethod";

export interface IAuthAdapter {

  type: string;

  identifier?: string;

  hasRequirements(): boolean;

  prepare(passport: passport.PassportStatic, authOptions: IAuthOptions): void;

  beforeUse?(app: IApplication): void;

  afterUse?(app: IApplication): void;

  getModelFor(stage: AuthLifeCycle): Function;

  authenticate(login: any): Promise<boolean> | boolean;

  getAuth(login: any): Promise<AuthMethod>;

}
