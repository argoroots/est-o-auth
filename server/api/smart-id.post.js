export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'session'])
  await getClient(body)

  const sidSession = await getSessionData(`smart-id:${body.session}`, false, SESSION_TTL.SK)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid or expired session' })

  const skResponse = await skFetch(`https://rp-api.smart-id.com/v3/session/${sidSession.skSession}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING') return { status: 'RUNNING' }

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw createError({ statusCode: 400, statusMessage: skResponse.result?.endResult || 'Smart-ID authentication failed' })
  }

  // Web2App flow completes via the callback endpoint, not here
  if (skResponse.signature?.flowType === 'Web2App') return { status: 'RUNNING' }

  const idcode = await verifyAndExtractIdentity(skResponse, sidSession)

  // Consume the session exactly once; a concurrent completion loses here
  if (!await getSessionData(`smart-id:${body.session}`, true)) throw createError({ statusCode: 403, statusMessage: 'Session already used' })

  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    provider: 'smart-id'
  }, sidSession)

  const search = new URLSearchParams({ code, state: sidSession.state }).toString()

  return { url: `${sidSession.redirect_uri}?${search}` }
})
