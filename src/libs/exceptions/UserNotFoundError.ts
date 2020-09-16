

export class UserNotFoundError extends Error {

  constructor(username: string) {
    super(`User with "${username}" not found.`);

    // @see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }

}
