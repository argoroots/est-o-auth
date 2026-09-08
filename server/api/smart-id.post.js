// Polls a Smart-ID login (QR flow): RUNNING or the client redirect with an authorization code
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'session'])

  const key = `smart-id:${body.session}`
  const session = await requireSession(key, SESSION_TTL.SK, body.client_id)
  const skResponse = await skFetch(`https://rp-api.smart-id.com/v3/session/${session.skSession}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING') return { status: 'RUNNING' }

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw createError({ statusCode: 400, statusMessage: skResponse.result?.endResult || 'Smart-ID authentication failed' })
  }

  // Web2App flow completes via the callback endpoint, not here
  if (skResponse.signature?.flowType === 'Web2App') return { status: 'RUNNING' }

  const identity = await verifySmartIdResponse(skResponse, session)

  await consumeSession(key)

  const code = await saveUser(identityUser(identity, 'smart-id'), session)

  return { url: codeRedirectUrl(session, code) }
})
