export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'e-mail', ['email', 'code'])

  const emailSession = isEmail(body.email) ? await verifyOtp('email', body.email, body.code) : undefined

  if (!emailSession) throw createError({ statusCode: 403, statusMessage: 'Invalid e-mail or code' })

  const code = await saveUser({
    id: emailSession.email,
    email: emailSession.email,
    provider: 'e-mail'
  }, emailSession)

  const search = new URLSearchParams({ code, state: emailSession.state }).toString()

  return { url: `${emailSession.redirect_uri}?${search}` }
})
