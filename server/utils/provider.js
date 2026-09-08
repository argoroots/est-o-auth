import jwt from 'jsonwebtoken'

// Google and Apple callbacks carry our signed state (client, redirect URI, client state).
// A tampered or expired state is a client error, not a crash.
export function verifyProviderState (state, secret) {
  try {
    return jwt.verify(state, secret, { algorithms: ['HS256'] })
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired state' })
  }
}

// Redirect URL for a declined or failed provider login, per RFC 6749 §4.1.2.1. Anything other than
// a user cancellation is reported as server_error so the client can distinguish the two.
export function providerErrorUrl (decodedState, providerError) {
  const cancelled = ['access_denied', 'user_cancelled_authorize'].includes(providerError)
  const search = new URLSearchParams({ error: cancelled ? 'access_denied' : 'server_error', state: decodedState.state }).toString()

  return `${decodedState.uri}?${search}`
}
