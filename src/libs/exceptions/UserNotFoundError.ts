

export class UserNotFoundError extends Error {

  constructor(username:string){
    super(`User with "${username}" not found.`);
  }

}
