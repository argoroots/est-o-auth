import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'google', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(query)
  const config = useRuntimeConfig()

  const search = new URLSearchParams({
    client_id: config.googleId,
    redirect_uri: `${config.url}/api/google`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    state: jwt.sign({ uri: query.redirect_uri, state: query.state }, config.jwtSecret, { expiresIn: '5m' })
  }).toString()

  await setUsage(client.id, 'google')

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${search}` }
})
