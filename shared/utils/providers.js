// Every authentication provider, in the order shown to users and in Stripe Checkout (eID methods
// first). Auto-imported on both client and server. Each has an endpoint pair under server/api,
// a page under app/pages/auth, a label under `provider.*` in every i18n/locales file, and a Stripe
// meter named oauth_<id>. `limit` is the hard cap of authentications per client per calendar month.
export const PROVIDERS = [
  { id: 'smart-id', limit: 1000 },
  { id: 'mobile-id', limit: 1000 },
  { id: 'id-card', limit: 1000 },
  { id: 'e-mail', limit: 100000 },
  { id: 'phone', limit: 1000 },
  { id: 'google' },
  { id: 'apple' }
]

export const PROVIDER_IDS = PROVIDERS.map((p) => p.id)
