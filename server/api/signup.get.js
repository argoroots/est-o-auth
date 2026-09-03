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

  const clientId = toBase62(createHash('sha256').update(sessionId + config.jwtSecret).digest()).substring(0, 16)
  const clientSecret = toBase62(randomBytes(48)).substring(0, 32)

  await saveClient({
    id: clientId,
    secret: await bcrypt.hash(clientSecret, 10),
    skidText: (session.name || 'Log in').substring(0, 60),
    providers: session.providers,
    redirectUris: session.redirectUri ? [session.redirectUri] : [],
    stripeId: session.customer
  })

  return {
    client_id: clientId,
    client_secret: clientSecret
  }
})

function toBase62 (buffer) {
  return Array.from(buffer, (byte) => BASE62[byte % 62]).join('')
}
