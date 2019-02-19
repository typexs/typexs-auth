export const ALLOWED_USER_PASSWORD_REGEX = /^(\w|\d|_|\$|%|&|§|\?|!|#|;|:|\+|~|\-|\.|\*)+$/;
export const K_LIB_AUTH_ADAPTERS = 'auth.adapters';
export const K_LIB_AUTH_CONFIGURATIONS = 'auth.configurations';
export type AuthLifeCycle = "signup" | "login" | "logout" | "data";
