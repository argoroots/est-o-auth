import { randomBytes } from 'crypto'

// Starts an ID-card login: issues the Web eID nonce, which opens the card dialog in the browser
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  await checkUsageLimit(client.id, 'id-card')

  // 32 random bytes -> 44 base64 chars, as the Web eID spec requires
  const nonce = randomBytes(32).toString('base64')

  await setSessionData(`id-card:${nonce}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state
  }, SESSION_TTL.NONCE)

  await recordUsage(client, 'id-card')

  return { nonce }
})
