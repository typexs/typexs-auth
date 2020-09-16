

export class UserDisabledError extends Error {

  constructor(username: string) {
    super(`User with "${username}" is disabled. Please contact the administrator.`);
    Object.setPrototypeOf(this, UserDisabledError.prototype);
  }

}
