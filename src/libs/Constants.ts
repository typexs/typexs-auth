export const ALLOWED_USER_PASSWORD_REGEX = /^(\w|\d|_|\$|%|&|§|\?|!|#|;|:|\+|~|\-|\.|\*)+$/;
export const K_LIB_AUTH_ADAPTERS = 'auth.adapters';
export const K_LIB_AUTH_CONFIGURATIONS = 'auth.configurations';
export type AuthLifeCycle = 'signup' | 'login' | 'logout' | 'data';

export const API_USER = '/user';
export const _API_USER_CONFIG = '/_config';
export const _API_USER_IS_AUTHENTICATED = '/isAuthenticated';
export const _API_USER_SIGNUP = '/signup';
export const _API_USER_LOGIN = '/login';
export const _API_USER_LOGOUT = '/logout';
