# OAuth.ee

Use Estonian ID-card, Mobile-ID, Smart-ID, e-mail, phone, Google or Apple as an OAuth 2.0
authentication provider.

Integration documentation for service providers is at [oauth.ee/docs](https://oauth.ee/docs).
This file covers running and operating the service.

## Requirements

- Node.js 24
- AWS account: DynamoDB, SES (e-mail codes), SNS (SMS codes)
- SK ID Solutions relying-party account for Smart-ID and Mobile-ID
- Google and Apple developer apps for social login
- Stripe account for self-service sign-up and usage billing

## Configuration

Copy `.env.example` to `.env`. All values are read through Nuxt runtime config.

| Variable | Purpose |
|---|---|
| `NUXT_URL` | Public origin, e.g. `https://oauth.ee`. Used for Google/Apple redirect URIs, Smart-ID callbacks, e-mail links and the Web eID signed origin. |
| `NUXT_JWT_SECRET` | Signs access tokens and the Google/Apple state. Also used to derive client ids at sign-up. |
| `NUXT_EMAIL_FROM` | SES verified sender for e-mail codes. |
| `NUXT_AWS_ID`, `NUXT_AWS_SECRET`, `NUXT_AWS_REGION` | AWS credentials with DynamoDB, SES and SNS access. |
| `NUXT_SKID_NAME`, `NUXT_SKID_UUID` | Relying party name and UUID from SK, shared by Smart-ID and Mobile-ID. |
| `NUXT_GOOGLE_ID`, `NUXT_GOOGLE_SECRET` | Google OAuth client. Redirect URI must be `NUXT_URL/api/google`. |
| `NUXT_APPLE_ID`, `NUXT_APPLE_TEAM`, `NUXT_APPLE_SECRET` | Sign in with Apple service id, team id and private key. Redirect URI must be `NUXT_URL/api/apple`. |
| `NUXT_STRIPE_KEY` | Stripe restricted key, see below. |
| `NUXT_TEST_USER` | Optional `client_id:email:code`: for that client only, that e-mail always accepts that code. For testing; leave unset in production. |

## AWS

### DynamoDB tables

| Table | Key | Contents |
|---|---|---|
| `oauth-clients` | `id` (S) | One row per client, see below. |
| `oauth-session` | `id` (S) | Short-lived state: verification codes, SK sessions, Web eID nonces, authorization codes, cooldown markers. Enable **Time to Live** on attribute `ttl`. |
| `oauth-usage` | `client` (S), `date` (S) | Per-client counters keyed `<provider>-<YYYY>`, `-<YYYY-MM>`, `-<YYYY-MM-DD>` and one row per request. Kept indefinitely. |

Sessions also expire logically on read (5 to 10 minutes depending on type), so table TTL only
governs physical cleanup.

### Client rows (`oauth-clients`)

| Attribute | Type | Meaning |
|---|---|---|
| `id` | S | `client_id`, 16 characters |
| `secret` | S | bcrypt hash of `client_secret` |
| `providers` | SS | Enabled providers: `smart-id`, `mobile-id`, `id-card`, `e-mail`, `phone`, `google`, `apple` |
| `skidText` | S | Service name shown in the Smart-ID and Mobile-ID apps (max 60 characters) |
| `description` | S or M | Text shown above the login options. Either one string or a map keyed by language, e.g. `{ "en": {"S": "..."}, "et": {"S": "..."} }`; the UI language (`lang` parameter) selects, falling back to `en`. |
| `redirectUris` | SS | Registered redirect URIs. Stored but not enforced. |
| `stripeId` | S | Stripe customer id. Usage is metered to it; clients without one are not billed. |

Self-service sign-up at `/api/signup` creates rows through Stripe Checkout. Rows can also be
created by hand; generate the secret with e.g. `openssl rand -base64 24` and store its bcrypt hash.

## SK ID Solutions

Smart-ID uses RP API v3 (`rp-api.smart-id.com`), Mobile-ID the REST API (`mid.sk.ee`), ID-card the
Web eID browser extension. All three verify the returned signature and certificate against pinned
issuing CAs in `server/assets/certs/`:

| File | CA | Used by |
|---|---|---|
| `esteid2018.pem.crt` | ESTEID2018 | ID-card |
| `ESTEID-SK_2015.pem.crt` | ESTEID-SK 2015 | ID-card, Mobile-ID |
| `EID-SK_2016.pem.crt` | EID-SK 2016 | Mobile-ID |
| `EID_Q_2021E.pem.crt`, `EID_Q_2021R.pem.crt` | SK ID Solutions EID-Q 2021E / 2021R | Smart-ID, Mobile-ID |
| `EID_Q_2024E.pem.crt`, `EID_Q_2024R.pem.crt` | SK ID Solutions EID-Q 2024E / 2024R | Smart-ID |

Download them from the Intermediate CAs tab at
[skidsolutions.eu/resources/certificates](https://www.skidsolutions.eu/resources/certificates/) and
check the SHA-1 fingerprint against the page:

```bash
openssl x509 -in server/assets/certs/esteid2018.pem.crt -noout -fingerprint -sha1
```

When SK adds a new issuing CA, add its file here and to `TRUSTED_ISSUERS` in
`server/utils/eid-certificate.js`. ID-card certificates are also checked for revocation against
SK's public OCSP responders.

## Stripe

Usage is billed with Stripe meters. In the Stripe dashboard create:

1. One meter per provider with event name `oauth_<provider>`, e.g. `oauth_smart-id`, aggregation sum.
2. One metered recurring monthly price per meter, on any product.
3. A restricted API key with: Checkout Sessions write, Customers write, Subscriptions write,
   Products and Prices read, Meters read, Meter Events write.

Sign-up finds the prices by walking meters whose event name starts with `oauth_`; keep exactly one
active price per meter. Subscriptions are anchored to the first of the month.

## Running

```bash
npm install
npm run dev
```

`npm run dev:ssl` serves HTTPS on localhost using `.certs/localhost.crt` and `.certs/localhost.key`,
which the Web eID extension requires. Generate them once:

```bash
mkdir .certs && openssl req -x509 -out .certs/localhost.crt -keyout .certs/localhost.key -newkey rsa:2048 -nodes -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost'
```

Production:

```bash
npm run build
npm run start
```

`npm run lint` runs ESLint. `/signup?mock=true` previews the sign-up result page in development.

## Operations

- Monthly caps per client and provider are in `shared/utils/providers.js`; over the cap the start
  request answers 429 and a `[limit]` line is logged.
- E-mail and phone codes: one live code per target, 60 second resend cooldown, five attempts,
  10 minute expiry. Mobile-ID starts are limited to one per minute per ID code.
- Request failures are logged as one line: status, method, path, `client=`, `provider=` and the
  message. 5xx add the stack.
- UI language: `lang=en|et|fi` on any auth URL; translations in `i18n/locales/`.
