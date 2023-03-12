import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const search = new URLSearchParams({
    client_id: config.googleId,
    redirect_uri: `${config.url}/api/google`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    state: jwt.sign({ uri: query.redirect_uri, state: query.state }, config.jwtSecret, { expiresIn: '5m' })
  }).toString()

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${search}` }
})
