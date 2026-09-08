import bcrypt from 'bcrypt'

const TOKEN_LIFETIME_S = 3600

// Token endpoint per RFC 6749 §4.1.3 / §5. Failures use the §5.2 shape ({ error, error_description })
// with 400, or 401 for a failed client authentication, so standard OAuth client libraries understand them.
export default defineEventHandler(async (event) => {
  const body = await readBody(event) ?? {}

  // Token responses must not be cached (§5.1)
  setResponseHeaders(event, { 'Cache-Control': 'no-store', Pragma: 'no-cache' })

  const fail = (status, error, description) => {
    console.warn(`[warn] ${status} POST /api/token client=${logSafe(body.client_id ?? '-')}: ${error}: ${description}`)
    setResponseStatus(event, status)

    return { error, error_description: description }
  }

  for (const name of ['client_id', 'client_secret', 'grant_type', 'code']) {
    if (!body[name]) return fail(400, 'invalid_request', `Parameter ${name} is required`)
  }

  if (body.grant_type !== 'authorization_code') return fail(400, 'unsupported_grant_type', 'grant_type must be "authorization_code"')

  const client = await getClientConfig(body.client_id)

  if (!client || !await bcrypt.compare(body.client_secret, client.secret)) return fail(401, 'invalid_client', 'Unknown client_id or wrong client_secret')

  const token = await getToken(body.code, client.id, body.redirect_uri, TOKEN_LIFETIME_S)

  if (!token) return fail(400, 'invalid_grant', 'Authorization code is invalid, expired, already used, or was issued to another client or redirect_uri')

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: TOKEN_LIFETIME_S
  }
})
