export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone', 'code'])

  const phoneSession = isPhone(body.phone) ? await verifyOtp(`phone:${body.phone}`, body.code) : undefined

  if (!phoneSession) throw createError({ statusCode: 403, statusMessage: 'Invalid phone or code' })

  const code = await saveUser({
    id: phoneSession.phone,
    phone: phoneSession.phone,
    provider: 'phone'
  }, phoneSession)

  const search = new URLSearchParams({ code, state: phoneSession.state }).toString()

  return { url: `${phoneSession.redirect_uri}?${search}` }
})
