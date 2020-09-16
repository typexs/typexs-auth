

export interface IErrorMessage {

  error?: Error;

  property: string;

  value: string;

  constraints?: {[k: string]: string};

}
