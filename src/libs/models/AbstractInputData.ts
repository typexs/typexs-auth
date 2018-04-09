import {IErrorMessage} from "../auth/IErrorMessage";
import {IProcessData} from "./IProcessData";
import * as _ from "lodash";


export abstract class AbstractInputData implements IProcessData {

  authId: string;

  user: any = null;

  errors: any = null;

  success: boolean = false;

  data:any = null;




  addErrors(){

  }

  addError(error:IErrorMessage){
    if(!this.errors){
      this.errors = []
    }
    this.errors.push(error);
  }

  parse(obj:any){
    _.assign(this, obj);
  }


}
