import { createPublicKey } from 'crypto'
import jwt from 'jsonwebtoken'

// Signing keys per JWKS URL, cached for the life of the process
const keys = {}

// Downloads a provider's JWKS and caches its keys as PEM by key id
async function fetchKeys (jwksUrl) {
  const { keys: jwks } = await $fetch(jwksUrl)

  keys[jwksUrl] = Object.fromEntries(jwks.map((jwk) => [jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' })]))
}

// Cached key for the id, refetching once when the id is unknown (key rotation)
async function getKey (jwksUrl, kid) {
  if (!keys[jwksUrl]?.[kid]) await fetchKeys(jwksUrl)

  return keys[jwksUrl]?.[kid]
}

// Verifies an OpenID Connect id_token (RS256, issuer, audience, expiry) and returns its claims, or throws 400
export async function verifyIdToken (idToken, { jwksUrl, issuer, audience }) {
  const kid = jwt.decode(idToken, { complete: true })?.header?.kid
  const key = kid && await getKey(jwksUrl, kid)

  if (!key) throw apiError(400, 'invalid.idTokenKey')

  try {
    return jwt.verify(idToken, key, { algorithms: ['RS256'], issuer, audience })
  }
  catch {
    throw apiError(400, 'invalid.idToken')
  }
}
