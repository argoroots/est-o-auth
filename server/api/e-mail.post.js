export default defineEventHandler(async (event) => {
  await checkRequest(event, 'e-mail', ['email', 'code'])

  const body = await readBody(event)

  const emailSession = await getSessionData(`email:${body.email}:${body.code}`, true)

  if (!emailSession) throw createError({ statusCode: 403, statusMessage: 'Invalid e-mail or code' })

  const code = await saveUser({
    id: emailSession.email,
    email: emailSession.email,
    provider: 'e-mail'
  })

  const search = new URLSearchParams({ code, state: emailSession.state }).toString()

  return { url: `${emailSession.redirect_uri}?${search}` }
})