import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'google', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  await checkUsageLimit(client.id, 'google')

  const config = useRuntimeConfig()

  const search = new URLSearchParams({
    client_id: config.googleId,
    redirect_uri: `${config.url}/api/google`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'openid email profile',
    hl: getLang(query.lang),
    state: jwt.sign({ client: client.id, uri: query.redirect_uri, state: query.state }, config.jwtSecret, { expiresIn: '5m' })
  }).toString()

  await setBillingUsage(client.stripeId, 'google')
  await setUsage(client.id, 'google')

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${search}` }
})
