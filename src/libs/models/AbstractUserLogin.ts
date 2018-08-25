import {AbstractInputData} from "./AbstractInputData";

export abstract class AbstractUserLogin extends AbstractInputData {

  authId: string;

  user: any = null;

  method: any = null;

  errors: any = null;

  success: boolean = false;

  isAuthenticated: boolean = false;

  token: string;

  abstract resetSecret(): void;

  abstract getSecret(): string;

  abstract getIdentifier(): string;

}
