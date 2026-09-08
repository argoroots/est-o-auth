import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export default defineEventHandler(async (event) => {
  const { session_id: sessionId } = getQuery(event)

  // No session yet: start Checkout and send the browser to Stripe
  if (!sessionId) return sendRedirect(event, await createCheckoutSession(), 303)

  const config = useRuntimeConfig()
  const session = await getCheckoutSession(sessionId)

  if (session.status !== 'complete' || !session.customer) throw createError({ statusCode: 402, statusMessage: 'Payment is not completed' })
  if (session.providers.length === 0) throw createError({ statusCode: 400, statusMessage: 'No authentication providers were selected' })

  const clientId = toBase62(createHash('sha256').update(sessionId + config.jwtSecret).digest(), 16)
  const clientSecret = toBase62(randomBytes(48), 32)
  const redirectUri = validRedirectUri(session.redirectUri)

  // The payment is done, so a bad URL must not fail the signup; it is left empty and filled in by hand
  if (session.redirectUri && !redirectUri) console.warn(`[signup] client ${clientId} redirect_uri rejected: ${logSafe(session.redirectUri)}`)

  await saveClient({
    id: clientId,
    secret: await bcrypt.hash(clientSecret, 10),
    skidText: (session.name || 'Log in').substring(0, 60),
    providers: session.providers,
    redirectUris: redirectUri ? [redirectUri] : [],
    stripeId: session.customer
  })

  return {
    client_id: clientId,
    client_secret: clientSecret
  }
})

// The buffer as a big-endian integer, written in base 62 and cut to `length` characters. Dividing
// the whole number keeps every character uniformly distributed (a per-byte `% 62` would favour
// the first eight characters of the alphabet). The buffer has far more bits than the output uses.
function toBase62 (buffer, length) {
  let value = BigInt(`0x${buffer.toString('hex')}`)
  let result = ''

  for (let i = 0; i < length; i++) {
    result = BASE62[Number(value % 62n)] + result
    value /= 62n
  }

  return result
}

// A usable redirect URI is absolute https (http only for localhost, for development clients) and
// has no fragment (RFC 6749 §3.1.2). Returns the value as typed, since registered URIs are compared
// as strings, or undefined.
function validRedirectUri (value) {
  if (!value) return

  try {
    const url = new URL(value)
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname)
    const isAllowedScheme = url.protocol === 'https:' || (url.protocol === 'http:' && isLocal)

    return isAllowedScheme && !url.hash ? value : undefined
  }
  catch {
    return undefined
  }
}
