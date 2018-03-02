import {IPassportAdapter} from "../../libs/IPassportAdapter";
import {IAuthOptions} from "../../middleware/Passport";

export const K_PASSPORT_DATABASE = 'database';

export interface IDatabaseAuthOptions extends IAuthOptions {

}

export class DatabaseAdapter implements IPassportAdapter {

  name:string = K_PASSPORT_DATABASE;


  hasRequirements(){
    // TODO check if database is enabled
    return true;
  }

}
