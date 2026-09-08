// Every provider in display and Checkout order; each has an api pair, an auth page, a `provider.*` label and a Stripe meter oauth_<id>; `limit` is the hard cap of authentications per client per calendar month
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
