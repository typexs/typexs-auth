
export abstract class AbstractUserLogin {

  authId: string;

  $state?: any;

  abstract resetSecret(): void;

  abstract getSecret(): string;

  abstract getIdentifier(): string;

}
