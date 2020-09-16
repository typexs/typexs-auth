

export class PasswordIsWrongError extends Error {

  constructor(username: string) {
    super(`Password for "${username}" is wrong.`);
    // @see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PasswordIsWrongError.prototype);

  }

}
