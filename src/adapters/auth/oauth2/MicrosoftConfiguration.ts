import {IAuthConfiguration} from "../../../libs/adapter/IAuthConfiguration";
import {IOAuth2Options} from "./IOAuth2Options";
import * as _ from "lodash";
import {OAuth2Adapter} from "./OAuth2Adapter";
import {IAuthMethod} from "../../../libs/models/IAuthMethod";
import {IAuthAdapter} from "../../../libs/adapter/IAuthAdapter";


const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';


export class MicrosoftConfiguration implements IAuthConfiguration {


  id: string = 'microsoft';


  configure(options: IOAuth2Options) {
    options.authorizationURL = options.authorizationURL ?
      options.authorizationURL : AUTH_URL;
    options.tokenURL = options.tokenURL ?
      options.tokenURL : TOKEN_URL;

    if (_.has(options, 'scope')) {
      if(_.isArray(options['scope'])){
        _.set(options, 'scope', options.scope.join(','))
      }else{
        _.set(options, 'scope', options.scope)
      }

    } else {
      throw new Error('scope is required for onedrive');
    }
  }


  onAuthentication(adapter: IAuthAdapter, accessToken: string, refreshToken: string, profile: any) : Promise<any> {
    let self = this;
    return new Promise((resolve, reject) => {
      (<any>adapter).strategy._oauth2.get(
        'https://graph.microsoft.com/v1.0/me',
        //'https://api.onedrive.com/v1.0/drive',
        accessToken,
        function (err: Error, body: any, res: any) {
          if (err) {
            return reject(new OAuth2Adapter.OAuth2Strategy.InternalOAuthError('failed to fetch user profile', err))
          }
          try {
            let json = JSON.parse(body);

            let _profile: IAuthMethod = {
              authId: self.id,
              type: adapter.type,
              identifier: json.userPrincipalName,
              mail: json.mail ? json.mail : json.userPrincipalName,
              data: json
            };
            resolve(_profile);
          }
          catch (e) {
            reject(e);
          }
        }
      )
    });
  }
}
