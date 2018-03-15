import {AbstractInputData} from "./AbstractInputData";

export abstract class AbstractUserSignup extends AbstractInputData{

  authId: string;

  user: any = null;

  errors: any = null;

  success: boolean = false;


  abstract resetSecret(): void;

}
