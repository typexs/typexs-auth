export abstract class AbstractUserSignup {

  authId: string;

  $state?: any;

  abstract resetSecret(): void;

  abstract getSecret(): string;

  abstract getIdentifier(): string;

  abstract getMail(): string;

}
