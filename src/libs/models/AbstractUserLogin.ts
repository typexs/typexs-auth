import {AbstractInputData} from "./AbstractInputData";

export abstract class AbstractUserLogin extends AbstractInputData{

  authId: string;

  user: any = null;

  errors: any = null;

  success: boolean = false;

  isAuthenticated: boolean = false;

  abstract resetSecret(): void;
  abstract getSecret():string;
  abstract getIdentifier():string;

}
