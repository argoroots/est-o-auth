import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const nonce = randomBytes(32).toString('base64')

  return { nonce }
})
