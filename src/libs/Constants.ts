export const ALLOWED_USER_PASSWORD_REGEX = /^(\w|\d|_|\$|%|&|§|\?|!|#|;|:|\+|~|\-|\.|\*)+$/;
export const K_LIB_AUTH_ADAPTERS = 'auth.adapters';
export const K_LIB_AUTH_CONFIGURATIONS = 'auth.configurations';
export type AuthLifeCycle = 'signup' | 'login' | 'logout' | 'data';

export const API_USER = '/user';
export const _API_USER_CONFIG = '/_config';
export const API_USER_CONFIG = API_USER + _API_USER_CONFIG;

export const API_GET_USER = API_USER;

export const _API_USER_IS_AUTHENTICATED = '/isAuthenticated';
export const API_USER_IS_AUTHENTICATED = API_USER + _API_USER_IS_AUTHENTICATED;


export const _API_USER_SIGNUP = '/signup';
export const API_USER_SIGNUP = API_USER + _API_USER_SIGNUP;


export const _API_USER_LOGIN = '/login';
export const API_USER_LOGIN = API_USER + _API_USER_LOGIN;


export const _API_USER_LOGOUT = '/logout';
export const API_USER_LOGOUT = API_USER + _API_USER_LOGOUT;


export const PERMISSION_ALLOW_ADMINISTER_PERMISSIONS = 'administer permissions';
// export const PERMISSION_ALLOW_ADMINISTER_NAMED_PERMISSION = 'administer :name permission';
