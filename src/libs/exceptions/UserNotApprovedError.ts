

export class UserNotApprovedError extends Error {

  constructor(username: string) {
    super(`User with "${username}" is not approved. Please contact the administrator.`);
    Object.setPrototypeOf(this, UserNotApprovedError.prototype);
  }

}
