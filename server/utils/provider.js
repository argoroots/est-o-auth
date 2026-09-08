import jwt from 'jsonwebtoken'

// How long a Google/Apple round trip may take before the signed state expires
const STATE_LIFETIME = '5m'

// Signs the OAuth request into the state sent to Google/Apple, so the callback can finish the flow
export function signProviderState (client, query) {
  const payload = { client_id: client.id, redirect_uri: query.redirect_uri, state: query.state }

  return jwt.sign(payload, useRuntimeConfig().jwtSecret, { expiresIn: STATE_LIFETIME })
}

// Verifies the state a provider sent back; tampered or expired is a 400, not a crash
export function verifyProviderState (state) {
  try {
    return jwt.verify(state, useRuntimeConfig().jwtSecret, { algorithms: ['HS256'] })
  }
  catch {
    throw apiError(400, 'invalid.state')
  }
}

// Client redirect carrying the authorization code (RFC 6749 §4.1.2)
export function codeRedirectUrl (session, code) {
  return `${session.redirect_uri}?${new URLSearchParams({ code, state: session.state })}`
}

// Client redirect for a declined or failed login (RFC 6749 §4.1.2.1); only a user cancellation is access_denied
export function errorRedirectUrl (session, providerError) {
  const cancelled = ['access_denied', 'user_cancelled_authorize'].includes(providerError)
  const error = cancelled ? 'access_denied' : 'server_error'

  return `${session.redirect_uri}?${new URLSearchParams({ error, state: session.state })}`
}
