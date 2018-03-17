import {AbstractInputData} from "./AbstractInputData";

export abstract class AbstractUserSignup extends AbstractInputData {

  authId: string;

  user: any = null;

  errors: any = [];

  success: boolean = false;


  abstract resetSecret(): void;

  abstract getSecret():string;

  abstract getIdentifier():string;

  abstract getMail():string;

}
