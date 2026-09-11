# TODO

Open items are ordered by priority, then grouped by provider; items before the first provider heading apply to every provider.

## Critical / high security

1. **Enforce registered redirect URIs.** `validateRequest` logs `[redirect] client … redirect_uri … registered=true/false` for every request. Once every active client's `redirectUris` is filled in from the logs, uncomment the throw below that log line in `server/utils/client.js`, and make the token endpoint require `redirect_uri` rather than only comparing it when sent (`server/utils/storage.js`, `getToken`; RFC 6749 §4.1.3 makes it REQUIRED when it was in the authorization request, which it always is here). RFC 9700 §4.1.3: "Authorization servers MUST utilize exact string matching except for port numbers in localhost redirection URIs of native apps". Also reject a duplicated parameter as `invalid_request` (RFC 6749 §3.1: parameters "MUST NOT be included more than once"); today a doubled `client_id` reaches DynamoDB as an array and answers 500.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2.3
    - https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.1
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.1.3

2. **PKCE is not supported.** RFC 9700 §2.1.1: "Authorization servers MUST support PKCE [RFC7636]"; OAuth 2.1 (draft-ietf-oauth-v2-1-16) makes `code_challenge` required for every client. `server/utils/client.js` never reads `code_challenge` or `code_challenge_method` and `server/api/token.post.js` never reads `code_verifier`, so a client that sends both gets a token without any check. Store `code_challenge` (S256 only) with the code in `saveUser`, verify `code_verifier` in `getToken`, and apply the downgrade guard from RFC 9700 §4.8.2: "if there was no code_challenge in the authorization request, a request to the token endpoint containing a code_verifier is rejected". Add `code_challenge_methods_supported: ["S256"]` to the discovery document once it exists (id_token item).

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc9700#section-2.1.1
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.8
    - https://datatracker.ietf.org/doc/html/rfc7636
    - https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1

3. **A `redirect_uri` with a query string is corrupted.** RFC 6749 §3.1.2: the redirection endpoint URI "MAY include an application/x-www-form-urlencoded formatted query component, which MUST be retained when adding additional query parameters". `codeRedirectUrl` and `errorRedirectUrl` in `server/utils/provider.js` always append `?`, so `https://app/cb?x=1` becomes `https://app/cb?x=1?code=…` and the client sees no `code` parameter. Build the URL with `new URL()` and `searchParams.append`, in both functions.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2

### Smart-ID and Mobile-ID

4. **No TLS pinning to SK endpoints.** API details page: "The RP must implement HTTPS key (or certificate) pinning" for rp-api.smart-id.com; the same applies to mid.sk.ee. MID README 2.8: "The RP must implement HTTPS pinning … and verify that the X.509 certificate of the HTTPS endpoint belongs to MID API and is trusted" and "Verify if the HTTPS connection and the TLS handshake is performed with the secure TLS ciphersuite". `server/utils/sk.js` uses default Node TLS with no `minVersion`. Add an undici dispatcher whose `checkServerIdentity` compares the leaf SHA-256 fingerprint against pins from `NUXT_SK_PINS` (two per host so the next certificate can be added ahead of rotation), log `[sk] pin mismatch` and fail closed, and warn when the presented certificate expires within 30 days. Current pins: rp-api.smart-id.com DD:4E:25:A8:9C:3D:89:FB:8F:4F:01:46:9E:1E:1C:40:37:43:05:13:F2:71:0A:A3:F1:C6:44:64:18:E6:D4:D1 (until 2026-10-10), mid.sk.ee B3:0B:59:1C:19:3F:8B:B0:56:66:D4:83:2E:A3:25:7B:AC:04:E0:D2:3D:72:7E:64:10:5A:D7:25:89:7C:B0:C8 (until 2027-02-06). SK publishes the next one at https://sk-eid.github.io/smart-id-documentation/https_pinning.html about a month ahead.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/api_details.html
    - https://sk-eid.github.io/smart-id-documentation/https_pinning.html
    - https://github.com/SK-EID/MID#28-api-endpoint-authentication

### Smart-ID

5. **Smart-ID Web2App callback is not bound to the starting browser.** Callback URLs page: the RP "has to set a session cookie to the user's browser. This cookie must be set as SameSite=Lax" and on return must "verify that the user's session cookie matches with the random parameter attached in the callback URL", so a callback opened in another browser fails. `server/api/smart-id.get.js` sets no cookie and `server/api/smart-id-callback.get.js` only compares the URL value with the stored session. Set a `SameSite=Lax; Secure; HttpOnly` cookie holding the callback value at session start and require it in the callback.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/callback_urls.html

6. **Failed Smart-ID callback stays usable.** Callback URLs page: "The previous session cookie or the used callbackUrl must not be accepted after they are used once." `server/api/smart-id-callback.get.js` consumes the session only on success, so a failed callback can be retried until `SESSION_TTL.SK`. Consume the session on failure too.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/callback_urls.html

### Mobile-ID

7. **Mobile-ID result codes and timing reveal who has Mobile-ID.** SK Secure Implementation Guide (MUST): "it is the reponsibility of the RP not to show different UI messages for those cases, but to follow generic, uniform pattern", and for NOT_MID_CLIENT: "Generate random verification code value … Wait for 120 seconds and then show the error message \"User account not found or user didn't responded in time\"". `server/api/mobile-id.post.js` returns `{ status: skResponse.result }` verbatim, so NOT_MID_CLIENT arrives on the first poll while TIMEOUT takes two minutes, and `app/pages/auth/mobile-id.vue` auto-starts from URL parameters, so the oracle is scriptable. Map NOT_MID_CLIENT to a fake control code and the same two-minute wait as TIMEOUT, and never return SK result names to the browser.

    Source: SK
    - https://github.com/SK-EID/MID/wiki/Secure-Implementation-Guide#defence-display-generic-error-messages
    - https://github.com/SK-EID/MID/wiki/Secure-Implementation-Guide#attack-user-data-mining

### ID-card

8. **ID-cards issued since May 2025 are rejected.** Not from the Web eID docs but from the certificates themselves: Estonian ID-card certificates are now issued by `CN=ESTEID2025, O=Zetes Estonia OÜ` under `EEGovCA2025` (valid 2025-05-07 to 2040-05-03, CA issuers at http://crt.eidpki.ee/), which `server/utils/eid-certificate.js` does not trust, so those cards fail with `cert.untrusted` and the new `[cert]` log line will show this issuer. Add the ESTEID2025 PEM to `server/assets/certs` and to the `id-card` issuers with its OCSP responder URL, taken from the AIA extension of a certificate it issued. The file header comment pointing at skidsolutions.eu is wrong for this CA.

    Source: Own
    - http://crt.eidpki.ee/EEGovCA2025.crt
    - https://github.com/web-eid/web-eid-authtoken-validation-java#4-add-trusted-certificate-authority-certificates

### E-mail and phone

9. **Per-client hourly send cap for phone and e-mail.** Numbers are Estonian only now, which removes the premium-rate targets of SMS pumping, but a public client_id can still burn a client's whole monthly SMS or e-mail allowance in minutes across many Estonian numbers or addresses. Add an hourly usage bucket (`phone-2026-09-08T14`) next to the existing counters in `server/utils/storage.js` and check it in `checkUsageLimit` with a per-provider hourly limit in `shared/utils/providers.js`. Also set the SNS monthly SMS spend limit in the AWS console as a hard backstop.

    Source: Own
    - https://docs.aws.amazon.com/sns/latest/dg/sms_preferences.html

## Medium security and correctness

10. **Decide on `id_token`: the service is not OpenID Connect.** `scope=openid` is required but no `id_token` is issued, `nonce` is not passed through, there is no `/.well-known/openid-configuration`, no JWKS, and `/api/user` returns `id` instead of `sub`, so any OIDC library fails. `validateRequest` also requires `scope` to equal exactly `openid`, which rejects the standard `openid email profile` request; OIDC Core §3.1.2.1 says unrecognized scope values "SHOULD be ignored". Either implement OIDC (asymmetric-signed `id_token` with `iss`, `sub`, `aud`, `exp`, `iat`, `nonce`, `auth_time`, `amr` carrying the provider; discovery and JWKS; `sub` in the user info) or stop requiring `openid` and stay a plain OAuth 2.0 provider with `/api/user`. Since the product is an authentication provider, OIDC is the recommended choice.

    Source: OIDC
    - https://openid.net/specs/openid-connect-core-1_0.html#IDToken
    - https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
    - https://openid.net/specs/openid-connect-discovery-1_0.html

11. **Token endpoint does not support HTTP Basic client authentication.** RFC 6749 §2.3.1: the authorization server "MUST support the HTTP Basic authentication scheme for authenticating clients that were issued a client password"; the request-body form is only MAY (OAuth 2.1 relaxes Basic to MAY, but most OAuth libraries default to it). `server/api/token.post.js` reads `client_id` and `client_secret` from the body only, so those integrations fail on the first request. Accept `Authorization: Basic` (form-encoded then percent-decoded per §2.3.1), reject requests that use both methods as `invalid_request`, and on `invalid_client` for a Basic-authenticated request answer 401 with `WWW-Authenticate: Basic realm="oauth.ee"` (§5.2).

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
    - https://datatracker.ietf.org/doc/html/rfc6749#section-5.2

12. **`/api/user` 401 has no `WWW-Authenticate` header.** RFC 6750 §3: when the request "does not include authentication credentials or does not contain an access token that enables access to the protected resource, the resource server MUST include the HTTP WWW-Authenticate response header field". `server/api/user.get.js` returns a bare 401. Send `WWW-Authenticate: Bearer realm="oauth.ee"` when the header is absent and `Bearer realm="oauth.ee", error="invalid_token"` when the token fails verification.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6750#section-3

13. **Authorization code entropy is below the RFC floor.** RFC 6749 §10.10: the probability of guessing generated tokens "MUST be less than or equal to 2^(-128) and SHOULD be less than or equal to 2^(-160)". `saveUser` in `server/utils/storage.js` uses a v4 UUID, which has 122 random bits. Use `randomBytes(32).toString('base64url')`. The Smart-ID and Mobile-ID session ids have the same shape but are not OAuth credentials.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-10.10

14. **Authorization request errors never go back to the client.** RFC 6749 §4.1.2.1: with a valid `redirect_uri` and client, a bad `response_type` or `scope` is answered by redirecting with `error=unsupported_response_type` or `invalid_scope` (plus `error_description` and `state`); only a missing or invalid `redirect_uri` or `client_id` "MUST NOT automatically redirect". `validateRequest` renders the local error page for every failure. Do this only after registered redirect URIs are enforced, otherwise it is an open redirector.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1

15. **No `iss` in the authorization response.** RFC 9207 defines the parameter and RFC 9700 §4.4.2 tells clients to use it against mix-up attacks, which only works if the server sends it. Add `iss=<NUXT_URL>` to `codeRedirectUrl` and `errorRedirectUrl` in `server/utils/provider.js`, and `authorization_response_iss_parameter_supported: true` to the discovery document.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc9207
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.4

16. **Access token is not audience-restricted.** RFC 9700 §4.9.2: "Access tokens SHOULD be audience-restricted". `getToken` in `server/utils/storage.js` signs no `aud`, so a token issued to one client is accepted by `/api/user` for any client. Add `aud: clientId` (and `client_id` per RFC 9068) and check it on `/api/user`, or at least log it. Related: RFC 6749 §4.1.2 says a reused code "SHOULD revoke (when possible) all tokens previously issued based on that authorization code", which stateless HS256 tokens cannot do; document that as a known limitation.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.9
    - https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2

17. **CSP still allows inline scripts.** `.config/nuxt.config.ts` has `'unsafe-inline'` in `script-src` because Nuxt injects an inline importmap and config script on every page. Replace it with per-response SHA-256 hashes from a Nitro `render:html` plugin to get real XSS protection.

    Source: Own
    - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src

### Smart-ID and Mobile-ID

18. **No request timeout on SK calls.** MID README 3.3.4: "E-Service provider should set its own internal request timeout to a slightly higher value (add additional ~1500ms)" than `timeoutMs`. `server/utils/sk.js` passes no `timeout`, so a stalled connection hangs the handler. Pass `timeout: timeoutMs + 1500` from the callers, and set `retry: 0` explicitly since ofetch silently retries GETs on 5xx/429 while the README says "should not make new requests for given session before the previous request gets a response back".

    Source: SK
    - https://github.com/SK-EID/MID#334-long-polling

19. **SK authorization failures look like client errors.** MID README 3.2.6: "401 Failed to authorize user — User authorization by relyingPartyName, relyingPartyUUID and IP-address fails". `server/utils/sk.js` maps every SK 4xx to our 400 `sk.failed`, so a wrong UUID or IP allow-list reaches users as a 400 that monitoring ignores. Map SK 401/403 to our 502 and log at error level. Also remove the dead `error` branch in `server/api/mobile-id.get.js`, since `skFetch` throws on every non-2xx.

    Source: SK
    - https://github.com/SK-EID/MID#326-error-conditions

### Smart-ID

20. **Smart-ID certificate checks skip four steps of the response verification page.** No revocation check ("Verify that the certificate has not been revoked ... using OCSP, utilizing the AIA extension"; this contradicts the "no OCSP for Smart-ID and Mobile-ID" decision under Decided, so decide again), no policy OID check ("must contain all the specific policy OIDs designated by SK ID Solutions for the Smart-ID scheme", listed in SK's "Certificate and OCSP Profile for Smart-ID" chapter 2.2.3), no key usage check (`digitalSignature` plus the Smart-ID authentication EKU `1.3.6.1.4.1.62306.5.7.0` for certificates from April 2025, or `digitalSignature`, `keyEncipherment`, `dataEncipherment` plus `id-kp-clientAuth` for older ones), and no basic constraints check (`cA` must be absent or false). `server/utils/smart-id.js` only checks level, chain and validity; `server/utils/web-eid.js` and `server/utils/ocsp.js` already have the parsing and OCSP plumbing to reuse.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/response_verification.html

21. **Smart-ID flowType not validated.** OpenAPI: "RP must make sure that the flowType that is returned was one of the options provided for the user." `server/api/smart-id.post.js` only special-cases Web2App and `server/utils/smart-id.js` signs whatever flowType came back. Reject anything but `QR` in the poll and require `Web2App` in the callback.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/api_specification.html

22. **Smart-ID does not work on plain-http dev.** `initialCallbackUrl` must be https per the OpenAPI pattern, and `server/utils/origin.js` takes the dev origin from the request. Use the `dev:ssl` script for Smart-ID locally, or document it.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/api_specification.html
    - https://sk-eid.github.io/smart-id-documentation/rp-api/callback_urls.html

### Mobile-ID

23. **Mobile-ID certificate is not checked to be an authentication certificate.** MID README 3.3.5 calls `cert` the "Authentication certificate used" and the Secure Implementation Guide says "Only accept certificates with trusted issuance policy". `server/utils/mobile-id.js` checks only chain and validity; the user's signing certificate from the same CA would pass. Add the `id-kp-clientAuth` EKU and policy OID checks as `server/utils/web-eid.js` does for ID-card.

    Source: SK
    - https://github.com/SK-EID/MID#335-response-structure
    - https://github.com/SK-EID/MID/wiki/Secure-Implementation-Guide#only-accept-certificates-with-trusted-issuance-policy

### ID-card

24. **Web eID OCSP request has no nonce.** Validator README: the nonce extension is on by default and `withNonceDisabledOcspUrls` exists only for "OCSP responders [that] don't support the nonce extension". `server/utils/ocsp.js` builds the request without a nonce and never compares one in the response, so a captured "good" response can be replayed over the plain-http responder channel. Add a random nonce extension to the request and require the same value in the response.

    Source: Web eID
    - https://github.com/web-eid/web-eid-authtoken-validation-java#extended-configuration

25. **Web eID OCSP freshness is looser than documented.** Validator README: "The default allowed time skew is 15 minutes" for `thisUpdate` and `nextUpdate`, and separately "The default maximum age [of thisUpdate] is 2 minutes". `server/utils/ocsp.js` accepts a `thisUpdate` up to 17 minutes old by adding the two, and its comment claims to match the reference defaults. Apply the 2-minute age and the 15-minute skew separately, and reject `nextUpdate` earlier than `thisUpdate`.

    Source: Web eID
    - https://github.com/web-eid/web-eid-authtoken-validation-java#extended-configuration

26. **Web eID nonce is not bound to the browser that requested it.** Validator README: "it must be guaranteed that the authentication token is received from the same browser to which the corresponding challenge nonce was issued, using a session-backed challenge nonce store". web-eid.js README: "To use Web eID securely, CSRF protection must be enabled." `server/api/id-card.get.js` stores the nonce keyed by its own value and `server/api/id-card.post.js` accepts it from any browser that knows it, bound only to `client_id`. The impact is low here because no cookie session exists and the JSON response is unreadable cross-site, but it deviates from a MUST. Set a `SameSite=Lax; Secure; HttpOnly` cookie at nonce issue and require it on the POST, the same mechanism as the Smart-ID callback item.

    Source: Web eID
    - https://github.com/web-eid/web-eid-authtoken-validation-java#2-configure-the-challenge-nonce-store
    - https://github.com/web-eid/web-eid.js#2-activate-csrf-protection

## Improvements

27. **Token endpoint details.** `grant_type=refresh_token` without `code` answers "Parameter code is required" instead of `unsupported_grant_type`; check `grant_type` before the other parameters. `app/pages/docs.vue` shows only a JSON body, while RFC 6749 §4.1.3 specifies `application/x-www-form-urlencoded`, which h3's `readBody` already accepts; document both. `Pragma: no-cache` is harmless but no longer in OAuth 2.1. Consider rate limiting `/api/token` per client, since each request costs a bcrypt compare and nothing limits secret guessing.

    Source: RFC
    - https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
    - https://datatracker.ietf.org/doc/html/rfc6749#section-5.2

28. **Google and Apple upstream flows use the recommended defaults only partly.** Our signed `state` is not bound to the starting browser by a cookie, so login CSRF against the downstream client is stopped only by that client's own `state` check (RFC 9700 §4.7). No `nonce` is sent to Google or Apple and checked in the `id_token` (OIDC Core §3.1.2.1, RECOMMENDED), no PKCE is used toward them (RFC 9700 §2.1.1, RECOMMENDED for confidential clients), and Google's `email_verified` claim is not read before the e-mail is put in the user profile. `server/utils/oidc.js` also refetches the JWKS on every unknown `kid`, so a flood of tokens with random key ids triggers a fetch per request; cap the refetch rate.

    Source: RFC / OIDC
    - https://datatracker.ietf.org/doc/html/rfc9700#section-4.7
    - https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
    - https://developers.google.com/identity/openid-connect/openid-connect#validatinganidtoken

29. **Runtime dependencies live in devDependencies.** `package.json` lists bcrypt, jsonwebtoken, stripe and the AWS SDKs as dev. It works because Nitro bundles them, but native `bcrypt` is fragile there. Move runtime packages to `dependencies`, or replace bcrypt with Node's built-in `scrypt`.

    Source: Own

### Smart-ID and Mobile-ID

30. **Log SK `traceId`.** MID README 3.2.7: responses "hold time and traceId parameters which are for Application Provider to find the application logs". `server/utils/sk.js` and the Mobile-ID handlers never log it, so a support ticket to SK cannot cite a trace. Log `traceId` on every SK error and on verification failures of a 200 response.

    Source: SK
    - https://github.com/SK-EID/MID#327-error-response-contents

### Smart-ID

31. **Smart-ID additional security measures.** SK recommends a trusted-browser cookie (Secure, HttpOnly, declared in the cookie policy, user-revocable), a different `displayText` for logins from an unknown browser ("Authentication started from an unknown browser…"), and suspicious-IP handling. None adopted; `displayText60` is the static per-client `skidText`.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/additional_security_measures.html

32. **Smart-ID result keys.** `DOCUMENT_UNUSABLE` ("User should either check his/her Smart-ID mobile application or turn to customer support") and `REQUIRED_INTERACTION_NOT_SUPPORTED_BY_APP` (app older than release 29) collapse into the generic `sid.failed`. Give them keys with actionable text.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/api_specification.html
    - https://sk-eid.github.io/smart-id-documentation/faq.html

### Mobile-ID

33. **Mobile-ID polling cadence.** MID README 3.3.4: "the E-Service provider is recommended to use long polling by setting parameter timeoutMs … the caller is encouraged to immediately create a new long polling request." `server/api/mobile-id.post.js` uses `timeoutMs=2000` and the page waits 5 s between polls, so login completes up to 7 s after the PIN. Raise `timeoutMs` toward 30000 with an immediate re-poll, or drop the browser pause to 1 s.

    Source: SK
    - https://github.com/SK-EID/MID#334-long-polling

34. **Mobile-ID display text.** Secure Implementation Guide (MUST): `displayText` "helps the user understand the context of the operation" and generic service names "are not accepted (such as \"login\", \"authentication\", etc)". `server/api/mobile-id.get.js` falls back to "Log in" when a client has no `skidText`, and cuts `skidText` with `substring(0, 50)` by UTF-16 units, which can split a surrogate pair and ignores that GSM-7 text may be 100 characters. Require `skidText` at signup, truncate by code points, and pick GSM-7 when the text allows.

    Source: SK
    - https://github.com/SK-EID/MID/wiki/Secure-Implementation-Guide#defence-use-distinguishing-and-well-known-servicename-and-displaytext
    - https://github.com/SK-EID/MID#323-request-parameters

35. **Mobile-ID DEMO environment.** Environment page: DEMO base `https://tsp.demo.sk.ee/mid-api`, UUID `00000000-0000-0000-0000-000000000000`, name `DEMO`, TEST CAs, plus test numbers for every result code. The base URL is hard-coded in both Mobile-ID handlers and no TEST CAs are pinned, so the documented automated tests cannot run. Make the base URL and CA set configurable.

    Source: SK
    - https://github.com/SK-EID/MID/wiki/Environment-technical-parameters
    - https://github.com/SK-EID/MID/wiki/Test-number-for-automated-testing-in-DEMO

36. **Mobile-ID revocation check.** MID README 3.3.6 asks only for expiry and a trusted CA, and README 5.1 says "MID-REST doesn't perform any OCSP requests" about signing; SK's Java client implies a revoked user gets NOT_MID_CLIENT, and the Secure Implementation Guide says "Use OCSP to check for the validity of certificate". `server/utils/mobile-id.js` never calls `checkRevocation` and the `mobile-id` issuers in `server/utils/eid-certificate.js` carry no OCSP URL. Decide together with the Smart-ID certificate checks item; the OCSP plumbing exists.

    Source: SK
    - https://github.com/SK-EID/MID#336-verifying-the-authentication-response
    - https://github.com/SK-EID/MID#51-ocsp-necessity
    - https://github.com/SK-EID/MID/wiki/Secure-Implementation-Guide#use-ocsp-to-check-for-the-validity-of-certificate

### ID-card

37. **Web eID origin is not asserted to be https.** Architecture doc: the origin's "scheme must be https" and it "must not end with a slash", using the ASCII serialization. `server/utils/origin.js` derives the origin from `NUXT_URL` through `new URL().origin`, which handles the slash and Punycode, but a misconfigured http URL only shows up as signature failures. Throw at startup when the configured origin is not https.

    Source: Web eID
    - https://github.com/web-eid/web-eid-system-architecture-doc#protection-against-man-in-the-middle-attacks-during-authentication-with-origin-validation
    - https://github.com/web-eid/web-eid-authtoken-validation-java#basic-usage

38. **web-eid:1.1 intermediate certificates are ignored.** Architecture doc: "if the token contains unverifiedIntermediateCertificates (see web-eid:1.1), they are used only as untrusted input for building the certificate path to the trusted anchor". `server/utils/web-eid.js` reads only the four 1.0 fields. Harmless while the trust anchors are the issuing CAs themselves, but a deeper hierarchy would fail. Accept and use them when present.

    Source: Web eID
    - https://github.com/web-eid/web-eid-system-architecture-doc#token-format-version-web-eid11

39. **ID-card names are upper case.** Validator README provides `TitleCase` for names read from the certificate, giving "Jaak-Kristjan". `server/utils/eid-certificate.js` passes the certificate's "JAAK-KRISTJAN JÕEORG" through unchanged, and its subject parsing splits on "=" and would truncate a value containing one. Title-case given name and surname, and parse the subject by attribute.

    Source: Web eID
    - https://github.com/web-eid/web-eid-authtoken-validation-java#7-implement-authentication

## UI and accessibility

### Smart-ID

40. **Smart-ID options per device type.** User experience page: phones and tablets get both "Open Smart-ID app" and "Scan QR code with another device", "Computer: Provide one option", the QR. `app/pages/auth/smart-id.vue` wraps the QR in the Web2App link on every device, so a click on a PC lands on SK's fallback page. Detect mobile and show two explicit buttons there, QR only on desktop.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/user_experience.html

41. **Smart-ID old tab after Web2App.** SK suggests closing the originating tab once the callback completes elsewhere, and telling the user to "try again from your default browser" when the callback lands in a different browser. Today the old tab shows "Invalid or expired session" after the callback consumes the session.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/user_experience.html

42. **Smart-ID session expiry warning.** User experience page asks to warn that "This session is about to expire" over the last minute. The QR rotates silently until `SESSION_TTL.SK`.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/user_experience.html

43. **Smart-ID QR size.** Device link flows page recommends 6 to 10 pixels per module and a 4-module quiet zone, SVG preferred. `app/components/qr-code.client.vue` renders 256 px with `margin: 2`, about 4.5 px per module for a real link. Raise to about 400 px and margin 4.

    Source: SK
    - https://sk-eid.github.io/smart-id-documentation/rp-api/device_link_flows.html

### Mobile-ID

44. **Mobile-ID failure messages.** MID README 3.3.8 gives distinct meanings (TIMEOUT "did not confirm or refuse the operation within maximum time frame", USER_CANCELLED, PHONE_ABSENT "Sim not available", DELIVERY_ERROR, SIM_ERROR, SIGNATURE_HASH_MISMATCH "contact his/her mobile operator"). `app/pages/auth/mobile-id.vue` shows "Something is not right! Check ID code and Phone." for all of them. Add `mid.*` keys for each, keeping NOT_MID_CLIENT merged with TIMEOUT per the Mobile-ID enumeration item.

    Source: SK
    - https://github.com/SK-EID/MID#338-session-end-result-codes

45. **Mobile-ID cancel and cooldown.** Cancel in `app/pages/auth/mobile-id.vue` only stops polling: the phone still shows the prompt until SK times out, and a retry or reload hits the 60 s per-person cooldown from `server/api/mobile-id.get.js` and shows "Please wait before trying again". The cooldown is also recorded before the SK call, so a failed start costs the minute. Record the cooldown only after SK accepted the session, and tell the user on cancel that the phone prompt will expire on its own.

    Source: Own

46. **International prefix in phone input.** `app/utils/normalize.js` turns "00372…" into "+00372…", which the server rejects. Strip a leading "00" before adding "+".

    Source: Own

### ID-card

47. **Web eID error codes collapsed.** web-eid.js README gives distinct handling: `ERR_WEBEID_NATIVE_FATAL` "Log the incident and instruct the user to try again", `ERR_WEBEID_NATIVE_INVALID_ARGUMENT` "Log the incident and make sure that it reaches the backend developers", `ERR_WEBEID_VERSION_INVALID` and `ERR_WEBEID_UNKNOWN_ERROR` "Report a bug", and `ERR_WEBEID_ACTION_TIMEOUT` "Should not happen. Report a bug". `app/components/web-eid.client.vue` shows the generic failure for the first four with only a browser console line, and treats ACTION_TIMEOUT as an ordinary user timeout. Send these codes to the server log and give the fatal and bug cases their own text.

    Source: Web eID
    - https://github.com/web-eid/web-eid.js#known-errors

## Decided

- `/api/client` returns usage to any caller with a `client_id`: kept for statistics.
- Analytics script on all pages: in-house, kept as is.
- Per-IP rate limiting: not viable, users share IPs behind company NAT. Abuse is bounded by input validation, one live code per target with a resend cooldown, the Mobile-ID per-person cooldown and per-client monthly limits.
- `/api/user` accepts `access_token` only as a Bearer header since 2026-09-08 (Entu migrated first); the query parameter is gone.
- Sign-up secret is shown exactly once; no redisplay or self-service regeneration.
- No OCSP for Smart-ID and Mobile-ID certificates; SK checks revocation before returning OK. ID-card keeps its own OCSP check. (SK's Smart-ID response verification page asks the RP to check revocation itself; see the Smart-ID certificate checks item.)
- Mobile-ID is Estonian only: +372 numbers, PNOEE identities and the three Estonian PROD CAs. Lithuanian Mobile-ID (+370, PNOLT, RCSC IssuingCA) is documented by SK but not offered.
- Stripe price listing stays at one page; the account holds only the seven OAuth prices.
- E-mail/phone and Google/Apple pages stay as separate files for readability.
- OAuth checks already verified as correct (2026-09-11 audit against RFC 6749, 7636, 6750, 9700, OAuth 2.1 draft 16, OIDC Core): single-use codes consumed atomically, code bound to `client_id` and `redirect_uri`, 10-minute code lifetime, `state` required and echoed exactly, bearer token only in the header, `Cache-Control: no-store` on token and user responses, `invalid_client` as 401 with identical errors for unknown client and wrong secret, bcrypt secrets, pinned JWT algorithms, upstream `id_token` issuer/audience/expiry checks, `access_denied` only on user cancellation, 302 redirects, clickjacking and referrer headers.
