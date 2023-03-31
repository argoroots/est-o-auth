import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const data = isMethod(event, 'GET') ? getQuery(event) : await readBody(event)
  const config = useRuntimeConfig()

  checkRequest(data, 'google', ['code', 'state'])

  if (!data.state) throw createError({ statusCode: 400, statusMessage: 'Parameter state is required' })
  if (!data.code) throw createError({ statusCode: 400, statusMessage: 'Parameter code is required' })
  if (data.error) throw createError({ statusCode: 500, statusMessage: data.error })

  const decodedState = jwt.verify(data.state, config.jwtSecret)

  const { access_token: accessToken } = await $fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: {
      client_id: config.googleId,
      client_secret: config.googleSecret,
      redirect_uri: `${config.url}/api/google`,
      grant_type: 'authorization_code',
      code: data.code
    }
  })

  const profile = await $fetch('https://www.googleapis.com/plus/v1/people/me', { query: { access_token: accessToken } })

  const code = await saveUser({
    id: profile.id,
    email: profile.emails?.[0]?.value,
    name: profile.displayName,
    provider: 'google'
  })

  const search = new URLSearchParams({ code, state: decodedState.state }).toString()

  return sendRedirect(event, `${decodedState.uri}?${search}`)
})
