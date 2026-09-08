export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'google', ['state'])

  const config = useRuntimeConfig()
  const decodedState = verifyProviderState(body.state, config.jwtSecret)

  // User declined (or the provider failed): send them back to the client per RFC 6749 §4.1.2.1
  if (body.error || !body.code) return sendRedirect(event, providerErrorUrl(decodedState, body.error))

  const { id_token: idToken } = await $fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.googleId,
      client_secret: config.googleSecret,
      redirect_uri: `${config.url}/api/google`,
      grant_type: 'authorization_code',
      code: body.code
    })
  })

  // Verified against Google's public keys, with issuer and audience checked
  const profile = await verifyIdToken(idToken, {
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: config.googleId
  })

  const code = await saveUser({
    // Same value the People API returned as resourceName before, so existing users keep their id
    id: `people/${profile.sub}`,
    email: profile.email,
    name: profile.name,
    provider: 'google'
  }, { client_id: decodedState.client, redirect_uri: decodedState.uri })

  const search = new URLSearchParams({ code, state: decodedState.state }).toString()

  return sendRedirect(event, `${decodedState.uri}?${search}`)
})
