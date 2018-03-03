

export class PasswordIsWrongError extends Error {

  constructor(username:string){
    super(`Password for "${username}" is wrong.`);
  }

}
