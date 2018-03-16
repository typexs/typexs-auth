export interface IProcessData {

  [key:string]:any;

  getMail?():string;

  getIdentifier?():string;

  getSecret?():string;

}
