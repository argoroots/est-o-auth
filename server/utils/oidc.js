import { createPublicKey } from 'crypto'
import jwt from 'jsonwebtoken'

// OpenID Connect id_token verification for Google and Apple. Each provider signs with one of its
// rotating RSA keys published as a JWKS; keys are cached per JWKS URL and refetched when a token
// names a key id we have not seen.
const keys = {}

async function fetchKeys (jwksUrl) {
  const { keys: jwks } = await $fetch(jwksUrl)

  keys[jwksUrl] = Object.fromEntries(jwks.map((jwk) => [jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' })]))
}

async function getKey (jwksUrl, kid) {
  if (!keys[jwksUrl]?.[kid]) await fetchKeys(jwksUrl)

  return keys[jwksUrl]?.[kid]
}

// Returns the verified claims (sub, email, name, ...) or throws a 400. audience is our client id
// at that provider; issuer may be a string or an array of accepted values.
export async function verifyIdToken (idToken, { jwksUrl, issuer, audience }) {
  const kid = jwt.decode(idToken, { complete: true })?.header?.kid
  const key = kid && await getKey(jwksUrl, kid)

  if (!key) throw createError({ statusCode: 400, statusMessage: 'Unknown id_token signing key' })

  try {
    return jwt.verify(idToken, key, { algorithms: ['RS256'], issuer, audience })
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id_token' })
  }
}
