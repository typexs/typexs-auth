import {Log} from "typexs-base";
import {IMiddleware,IApplication} from "typexs-server";



export class Passport implements IMiddleware {

  validate(cfg:any):boolean{
    Log.info(cfg);
    return false;
  }

  prepare():void{}

  use(app: IApplication): void{}

}
