export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'email', 'code'])

  const emailSession = isEmail(body.email) ? await verifyOtp('email', body.email, body.code) : undefined

  if (!emailSession) throw createError({ statusCode: 403, statusMessage: 'Invalid e-mail or code' })
  if (emailSession.client_id !== body.client_id) throw createError({ statusCode: 403, statusMessage: 'Code belongs to another client' })

  const code = await saveUser({
    id: emailSession.email,
    email: emailSession.email,
    provider: 'e-mail'
  }, emailSession)

  const search = new URLSearchParams({ code, state: emailSession.state }).toString()

  return { url: `${emailSession.redirect_uri}?${search}` }
})
