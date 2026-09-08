// Finishes an e-mail login: checks the code and returns the client redirect with an authorization code
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'email', 'code'])

  const session = isEmail(body.email) ? await verifyOtp('email', body.email, body.code) : undefined

  if (!session) throw apiError(403, 'invalid.emailOrCode')
  if (session.client_id !== body.client_id) throw apiError(403, 'session.codeOtherClient')

  const code = await saveUser({
    id: session.email,
    email: session.email,
    provider: 'e-mail'
  }, session)

  return { url: codeRedirectUrl(session, code) }
})
