export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'session'])

  await getClient(body)

  const sidSession = await getSessionData(`mobile-id:${body.idcode}:${body.session}`, false)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid idcode or session' })

  const skResponse = await checkMidSession(sidSession.skSession)

  if (skResponse !== 'OK') return { status: skResponse }

  await getSessionData(`mobile-id:${body.idcode}:${body.session}`, true)

  const code = await saveUser({
    id: sidSession.idcode,
    email: `${sidSession.idcode}@eesti.ee`,
    provider: 'mobile-id'
  })

  const search = new URLSearchParams({ code, state: sidSession.state }).toString()

  return { url: `${sidSession.redirect_uri}?${search}` }
})

async function checkMidSession (sessionId) {
  const skResponse = await $fetch(`https://mid.sk.ee/mid-api/authentication/session/${sessionId}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING') return 'RUNNING'
  if (skResponse.state === 'COMPLETE') return skResponse.result

  throw createError({ statusCode: 400, statusMessage: skResponse.error || 'Mobile-ID session check failed' })
}
