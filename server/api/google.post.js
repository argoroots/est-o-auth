export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'google', ['state'])

  const config = useRuntimeConfig()
  const decodedState = verifyProviderState(body.state, config.jwtSecret)

  // User declined (or the provider failed): send them back to the client per RFC 6749 §4.1.2.1
  if (body.error || !body.code) return sendRedirect(event, providerErrorUrl(decodedState, body.error))

  const { access_token: accessToken } = await $fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: {
      client_id: config.googleId,
      client_secret: config.googleSecret,
      redirect_uri: `${config.url}/api/google`,
      grant_type: 'authorization_code',
      code: body.code
    }
  })

  const profile = await $fetch('https://people.googleapis.com/v1/people/me', {
    query: {
      personFields: 'names,emailAddresses',
      access_token: accessToken
    }
  })

  const code = await saveUser({
    id: profile.resourceName,
    email: profile.emailAddresses?.at(0)?.value,
    name: profile.names?.at(0)?.displayName,
    provider: 'google'
  }, { client_id: decodedState.client, redirect_uri: decodedState.uri })

  const search = new URLSearchParams({ code, state: decodedState.state }).toString()

  return sendRedirect(event, `${decodedState.uri}?${search}`)
})
