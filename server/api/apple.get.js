import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'apple', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(query)
  const config = useRuntimeConfig()

  const search = new URLSearchParams({
    client_id: config.appleId,
    redirect_uri: `${config.url}/api/apple`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'email name',
    state: jwt.sign({ uri: query.redirect_uri, state: query.state }, config.jwtSecret, { expiresIn: '5m' })
  }).toString()

  await setBillingUsage(client.stripeId, 'apple')
  await setUsage(client.id, 'apple')

  return { url: `https://appleid.apple.com/auth/authorize?${search}` }
})
