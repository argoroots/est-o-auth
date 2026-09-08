// Google callback (form_post): exchanges the code, verifies the id_token and redirects to the client
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'google', ['state'])

  const config = useRuntimeConfig()
  const session = verifyProviderState(body.state)

  // User declined (or the provider failed): back to the client per RFC 6749 §4.1.2.1
  if (body.error || !body.code) return sendRedirect(event, errorRedirectUrl(session, body.error))

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
  }, session)

  return sendRedirect(event, codeRedirectUrl(session, code))
})
