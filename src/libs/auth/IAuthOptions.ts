export interface IAuthOptions {

  type: string

  authId?: string;

  clazz?: Function

  /**
   * Create automatically a local account when authentication succeed.
   */
  createOnLogin?: boolean

  /**
   * Allow signup for this adapter if it is supported
   */
  allowSignup?:boolean

}
