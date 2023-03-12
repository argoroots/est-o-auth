import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.state) throw createError({ statusCode: 400, statusMessage: 'Parameter state is required' })
  if (!body.code) throw createError({ statusCode: 400, statusMessage: 'Parameter code is required' })
  if (body.error) throw createError({ statusCode: 500, statusMessage: body.error })

  const decodedState = jwt.verify(body.state, config.jwtSecret)

  const clientSecret = jwt.sign({}, config.appleSecret, {
    issuer: config.appleTeam,
    subject: config.appleId,
    audience: 'https://appleid.apple.com',
    expiresIn: '5m',
    algorithm: 'ES256'
  })

  const { id_token: idToken } = await $fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    body: {
      client_id: config.appleId,
      client_secret: clientSecret,
      redirect_uri: `${config.url}/api/apple`,
      grant_type: 'authorization_code',
      code: body.code
    }
  })

  const profile = jwt.decode(idToken)

  const code = await saveUser({
    id: profile.sub,
    email: profile.email,
    provider: 'apple'
  })

  const search = new URLSearchParams({ code, state: decodedState.state }).toString()

  return sendRedirect(event, `${decodedState.uri}?${search}`)
})
