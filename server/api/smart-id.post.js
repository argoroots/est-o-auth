export default defineEventHandler(async (event) => {
  await checkRequest(event, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'session'])
  await getClient(event)

  const body = await readBody(event)

  const sidSession = await getSessionData(`smart-id:${body.idcode}:${body.session}`, false)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid idcode or session' })

  const skResponse = await checkSidSession(sidSession.skSession)

  if (skResponse !== 'OK') return { status: skResponse }

  await getSessionData(`smart-id:${body.idcode}:${body.session}`, true)

  const code = await saveUser({
    id: sidSession.idcode,
    email: `${sidSession.idcode}@eesti.ee`,
    provider: 'smart-id'
  })

  const search = new URLSearchParams({ code, state: sidSession.state }).toString()

  return { url: `${sidSession.redirect_uri}?${search}` }
})

async function checkSidSession (sessionId) {
  const skResponse = await $fetch(`https://rp-api.smart-id.com/v2/session/${sessionId}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING') return 'RUNNING'
  if (skResponse.state === 'COMPLETE') return skResponse.result?.endResult

  throw createError({ statusCode: 400, statusMessage: skResponse.error || 'Smart-ID session check failed' })
}
