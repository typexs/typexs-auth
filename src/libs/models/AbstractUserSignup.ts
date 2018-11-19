

export abstract class AbstractUserSignup {

  authId: string;

  abstract resetSecret(): void;

  abstract getSecret():string;

  abstract getIdentifier():string;

  abstract getMail():string;

}
