import {IErrorMessage} from "../auth/IErrorMessage";

export abstract class AbstractInputData {

  authId: string;

  user: any = null;

  errors: any = null;

  success: boolean = false;

  data:any = null;


  abstract resetSecret(): void;

  addErrors(){

  }

  addError(error:IErrorMessage){
    if(!this.errors){
      this.errors = []
    }
    this.errors.push(error);
  }
}
