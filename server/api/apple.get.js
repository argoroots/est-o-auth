import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const client = await getClient(event)

  const search = new URLSearchParams({
    client_id: config.appleId,
    redirect_uri: `${config.url}/api/apple`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'email name',
    state: jwt.sign({ uri: query.redirect_uri, state: query.state }, config.jwtSecret, { expiresIn: '5m' })
  }).toString()

  await setUsage(client.id, 'apple')

  return { url: `https://appleid.apple.com/auth/authorize?${search}` }
})
