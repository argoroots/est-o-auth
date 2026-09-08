# TODO

Open items are ordered from critical security to cosmetic.

## Critical / high security

1. **Enforce registered redirect URIs.** `validateRequest` logs `[redirect] client … redirect_uri … registered=true/false` for every request. Once every active client's `redirectUris` is filled in from the logs, uncomment the throw below that log line in `server/utils/client.js`, and make the token endpoint require `redirect_uri` rather than only comparing it when sent (`server/utils/storage.js`, `getToken`, RFC 6749 §4.1.3).
2. **Per-client hourly send cap for phone and e-mail.** Numbers are Estonian only now, which removes the premium-rate targets of SMS pumping, but a public client_id can still burn a client's whole monthly SMS or e-mail allowance in minutes across many Estonian numbers or addresses. Add an hourly usage bucket (`phone-2026-09-08T14`) next to the existing counters in `server/utils/storage.js` and check it in `checkUsageLimit` with a per-provider hourly limit in `shared/utils/providers.js`. Also set the SNS monthly SMS spend limit in the AWS console as a hard backstop.

## Medium security and correctness

3. **Decide on `id_token`.** `scope=openid` is required but no OpenID Connect `id_token` is issued. Either issue one (signed JWT with `iss`, `sub`, `aud`, `exp`, `iat`, plus discovery and JWKS so clients can validate it) or stop requiring `openid` and stay a plain OAuth 2.0 provider with `/api/user`.
4. **CSP still allows inline scripts.** `.config/nuxt.config.ts` has `'unsafe-inline'` in `script-src` because Nuxt injects an inline importmap and config script on every page. Replace it with per-response SHA-256 hashes from a Nitro `render:html` plugin to get real XSS protection.

## Improvements

5. **Token endpoint.** Support `client_secret_basic` (HTTP Basic) alongside the body, since most OAuth libraries default to it. Consider an `aud` claim bound to the client so a token issued to one client is rejected when presented by another.
6. **Runtime dependencies live in devDependencies.** `package.json` lists bcrypt, jsonwebtoken, stripe and the AWS SDKs as dev. It works because Nitro bundles them, but native `bcrypt` is fragile there. Move runtime packages to `dependencies`, or replace bcrypt with Node's built-in `scrypt`.

## Decided

- `/api/client` returns usage to any caller with a `client_id`: kept for statistics.
- Analytics script on all pages: in-house, kept as is.
- Per-IP rate limiting: not viable, users share IPs behind company NAT. Abuse is bounded by input validation, one live code per target with a resend cooldown, the Mobile-ID per-person cooldown and per-client monthly limits.
- `/api/user` accepts `access_token` only as a Bearer header since 2026-09-08 (Entu migrated first); the query parameter is gone.
- Sign-up secret is shown exactly once; no redisplay or self-service regeneration.
- No OCSP for Smart-ID and Mobile-ID certificates; SK checks revocation before returning OK. ID-card keeps its own OCSP check.
- Stripe price listing stays at one page; the account holds only the seven OAuth prices.
- E-mail/phone and Google/Apple pages stay as separate files for readability.
