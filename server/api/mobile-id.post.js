export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'session'])

  const midSession = await getSessionData(`mobile-id:${body.session}`, false, SESSION_TTL.SK)

  if (!midSession) throw createError({ statusCode: 403, statusMessage: 'Invalid or expired session' })
  if (midSession.client_id !== body.client_id) throw createError({ statusCode: 403, statusMessage: 'Session belongs to another client' })

  const skResponse = await checkMidSession(midSession.skSession)

  if (skResponse.state === 'RUNNING') return { status: 'RUNNING' }
  if (skResponse.result !== 'OK') return { status: skResponse.result }

  // Verify the signature and certificate ourselves rather than trusting the OK result alone
  const identity = await verifyMobileIdResponse(skResponse, midSession)

  if (identity.idcode !== midSession.idcode) {
    throw createError({ statusCode: 400, statusMessage: 'Certificate identity does not match the requested ID code' })
  }

  // Consume the session exactly once; a concurrent completion loses here
  if (!await getSessionData(`mobile-id:${body.session}`, true)) throw createError({ statusCode: 403, statusMessage: 'Session already used' })

  const code = await saveUser({
    id: identity.idcode,
    email: `${identity.idcode}@eesti.ee`,
    name: identity.givenName && identity.surname ? `${identity.givenName} ${identity.surname}` : undefined,
    provider: 'mobile-id'
  }, midSession)

  const search = new URLSearchParams({ code, state: midSession.state }).toString()

  return { url: `${midSession.redirect_uri}?${search}` }
})

async function checkMidSession (sessionId) {
  const skResponse = await skFetch(`https://mid.sk.ee/mid-api/authentication/session/${sessionId}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING' || skResponse.state === 'COMPLETE') return skResponse

  throw createError({ statusCode: 400, statusMessage: skResponse.error || 'Mobile-ID session check failed' })
}
