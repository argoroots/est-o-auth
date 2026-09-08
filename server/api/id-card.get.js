import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  // 32 random bytes -> 44 base64 chars, as required by the Web eID spec. The nonce is bound to the
  // client and redirect URI that requested it.
  const nonce = randomBytes(32).toString('base64')

  await setSessionData(`id-card:${nonce}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state
  }, SESSION_TTL.NONCE)

  return { nonce }
})
