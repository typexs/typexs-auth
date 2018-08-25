export interface ISAML2Options {


//   Core
// callbackUrl: full callbackUrl (overrides path/protocol if supplied)
// path: path to callback; will be combined with protocol and server host information to construct callback url if callbackUrl is not specified (default: /saml/consume)
// protocol: protocol for callback; will be combined with path and server host information to construct callback url if callbackUrl is not specified (default: http://)
// host: host for callback; will be combined with path and protocol to construct callback url if callbackUrl is not specified (default: localhost)
// entryPoint: identity provider entrypoint
// issuer: issuer string to supply to identity provider
// audience: expected saml response Audience (if not provided, Audience won't be verified)
// cert: see Security and signatures
// privateCert: see Security and signatures
// decryptionPvk: optional private key that will be used to attempt to decrypt any encrypted assertions that are received
// signatureAlgorithm: optionally set the signature algorithm for signing requests, valid values are 'sha1' (default), 'sha256', or 'sha512'
// Additional SAML behaviors
// additionalParams: dictionary of additional query params to add to all requests
// additionalAuthorizeParams: dictionary of additional query params to add to 'authorize' requests
// identifierFormat: if truthy, name identifier format to request from identity provider (default: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress)
// acceptedClockSkewMs: Time in milliseconds of skew that is acceptable between client and server when checking OnBefore and NotOnOrAfter assertion condition validity timestamps. Setting to -1 will disable checking these conditions entirely. Default is 0.
// attributeConsumingServiceIndex: optional AttributeConsumingServiceIndex attribute to add to AuthnRequest to instruct the IDP which attribute set to attach to the response (link)
// disableRequestedAuthnContext: if truthy, do not request a specific authentication context. This is known to help when authenticating against Active Directory (AD FS) servers.
// authnContext: if truthy, name identifier format to request auth context (default: urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport)
// forceAuthn: if set to true, the initial SAML request from the service provider specifies that the IdP should force re-authentication of the user, even if they possess a valid session.
// providerName: optional human-readable name of the requester for use by the presenter's user agent or the identity provider
// skipRequestCompression: if set to true, the SAML request from the service provider won't be compressed.
// authnRequestBinding: if set to HTTP-POST, will request authentication from IDP via HTTP POST binding, otherwise defaults to HTTP Redirect
// InResponseTo Validation
// validateInResponseTo: if truthy, then InResponseTo will be validated from incoming SAML responses
// requestIdExpirationPeriodMs: Defines the expiration time when a Request ID generated for a SAML request will not be valid if seen in a SAML response in the InResponseTo field. Default is 8 hours.
// cacheProvider: Defines the implementation for a cache provider used to store request Ids generated in SAML requests as part of InResponseTo validation. Default is a built-in in-memory cache provider. For details see the 'Cache Provider' section.
// Passport
// passReqToCallback: if truthy, req will be passed as the first argument to the verify callback (default: false)
// name: Optionally, provide a custom name. (default: saml). Useful If you want to instantiate the strategy multiple times with different configurations, allowing users to authenticate against multiple different SAML targets from the same site. You'll need to use a unique set of URLs for each target, and use this custom name when calling passport.authenticate() as well.
// Logout
// logoutUrl: base address to call with logout requests (default: entryPoint)
// additionalLogoutParams: dictionary of additional query params to add to 'logout' requests
// logoutCallbackUrl: The value with which to populate the Location attribute in the SingleLogoutService elements in the generated service provider metadata.
//

}

