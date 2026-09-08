import jwt from 'jsonwebtoken'

// Apple callback (form_post): exchanges the code, verifies the id_token and redirects to the client
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'apple', ['state'])

  const config = useRuntimeConfig()
  const session = verifyProviderState(body.state)

  // User declined (or the provider failed): back to the client per RFC 6749 §4.1.2.1
  if (body.error || !body.code) return sendRedirect(event, errorRedirectUrl(session, body.error))

  const { id_token: idToken } = await $fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.appleId,
      client_secret: appleClientSecret(config),
      redirect_uri: `${config.url}/api/apple`,
      grant_type: 'authorization_code',
      code: body.code
    })
  })

  const profile = await verifyIdToken(idToken, {
    jwksUrl: 'https://appleid.apple.com/auth/keys',
    issuer: 'https://appleid.apple.com',
    audience: config.appleId
  })

  const code = await saveUser({
    id: profile.sub,
    email: profile.email,
    name: appleName(body.user),
    provider: 'apple'
  }, session)

  return sendRedirect(event, codeRedirectUrl(session, code))
})

// Apple has no static client secret: it is a short-lived JWT signed with the team's private key
function appleClientSecret (config) {
  return jwt.sign({}, config.appleSecret, {
    issuer: config.appleTeam,
    subject: config.appleId,
    audience: 'https://appleid.apple.com',
    expiresIn: '5m',
    algorithm: 'ES256'
  })
}

// Full name from the `user` JSON field, which Apple sends only on the very first authorization
function appleName (userField) {
  try {
    const { name } = JSON.parse(userField)

    return [name?.firstName, name?.lastName].filter(Boolean).join(' ') || undefined
  }
  catch {
    return undefined
  }
}
