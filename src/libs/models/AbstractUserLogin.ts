
export abstract class AbstractUserLogin {

  authId: string;

  abstract resetSecret(): void;

  abstract getSecret(): string;

  abstract getIdentifier(): string;

}
