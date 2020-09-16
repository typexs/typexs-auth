import {IAuthAdapter} from './IAuthAdapter';

export interface IAuthConfiguration {

  id: string;

  configure(options: any): void;

  onAuthentication(adapter: IAuthAdapter, accessToken: string, refreshToken: string, profile: any): Promise<any>;

}
