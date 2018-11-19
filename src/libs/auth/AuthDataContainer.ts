import {DataContainer} from "@typexs/schema/libs/DataContainer";


export class AuthDataContainer<T> extends DataContainer<T> {

  //authId: string;

  isAuthenticated?: boolean = false;

  success: boolean = false;

  method?: any;

  token?: string;

  user?: any;

  data?: any;


  constructor(instance: T) {
    //sdf

    super(instance);
  }


}
