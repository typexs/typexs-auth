import {AbstractUserLogin} from "./AbstractUserLogin";

export class DefaultUserLogin extends AbstractUserLogin {

  username: string;

  password: string;

  resetSecret(){
    this.password = null;
  }

  getIdentifier(){
    return this.username;
  }

  getSecret(){
    return this.password;
  }
}
