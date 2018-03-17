import {AbstractInputData} from "./AbstractInputData";

export abstract class AbstractUserLogout extends AbstractInputData{

  authId: string;

  errors: any = null;

  success: boolean = false;

}
