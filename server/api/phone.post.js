// Finishes a phone login: checks the code and returns the client redirect with an authorization code
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone', 'code'])

  const session = isPhone(body.phone) ? await verifyOtp('phone', body.phone, body.code) : undefined

  if (!session) throw apiError(403, 'invalid.phoneOrCode')
  if (session.client_id !== body.client_id) throw apiError(403, 'session.codeOtherClient')

  const code = await saveUser({
    id: session.phone,
    phone: session.phone,
    provider: 'phone'
  }, session)

  return { url: codeRedirectUrl(session, code) }
})
