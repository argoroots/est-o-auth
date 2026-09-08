import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Signup: without a session starts Stripe Checkout, with a completed one creates the client and returns its credentials
export default defineEventHandler(async (event) => {
  const { session_id: sessionId } = getQuery(event)

  if (!sessionId) return sendRedirect(event, await createCheckoutSession(), 303)

  const config = useRuntimeConfig()
  const session = await getCheckoutSession(sessionId)

  if (session.status !== 'complete' || !session.customer) throw apiError(402, 'signup.paymentNotCompleted')
  if (session.providers.length === 0) throw apiError(400, 'signup.noProviders')

  // Client id is derived from the Checkout session, so a reload yields the same id (and a 409), never a second client
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

// The buffer as one big integer in base 62, cut to `length` characters; whole-number division keeps every character uniform
function toBase62 (buffer, length) {
  let value = BigInt(`0x${buffer.toString('hex')}`)
  let result = ''

  for (let i = 0; i < length; i++) {
    result = BASE62[Number(value % 62n)] + result
    value /= 62n
  }

  return result
}

// The value as typed if it is an absolute https URL (http only for localhost) without a fragment, else undefined
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
