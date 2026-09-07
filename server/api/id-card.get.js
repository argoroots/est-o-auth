import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  // 32 random bytes -> 44 base64 chars, as required by the Web eID spec
  const nonce = randomBytes(32).toString('base64')

  await setSessionData(`id-card:${nonce}`, { issued: Date.now() })

  return { nonce }
})
