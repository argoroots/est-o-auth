import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'apple', ['state'])

  const config = useRuntimeConfig()
  const decodedState = verifyProviderState(body.state, config.jwtSecret)

  // User declined (or the provider failed): send them back to the client per RFC 6749 §4.1.2.1
  if (body.error || !body.code) return sendRedirect(event, providerErrorUrl(decodedState, body.error))

  const clientSecret = jwt.sign({}, config.appleSecret, {
    issuer: config.appleTeam,
    subject: config.appleId,
    audience: 'https://appleid.apple.com',
    expiresIn: '5m',
    algorithm: 'ES256'
  })

  const { id_token: idToken } = await $fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.appleId,
      client_secret: clientSecret,
      redirect_uri: `${config.url}/api/apple`,
      grant_type: 'authorization_code',
      code: body.code
    })
  })

  const profile = jwt.decode(idToken)

  const code = await saveUser({
    id: profile.sub,
    email: profile.email,
    provider: 'apple'
  }, { client_id: decodedState.client, redirect_uri: decodedState.uri })

  const search = new URLSearchParams({ code, state: decodedState.state }).toString()

  return sendRedirect(event, `${decodedState.uri}?${search}`)
})
