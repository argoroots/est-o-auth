// Polls a Mobile-ID login: RUNNING, an SK failure result, or the client redirect with an authorization code
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await validateRequest(body, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'session'])

  const key = `mobile-id:${body.session}`
  const session = await requireSession(key, SESSION_TTL.SK, body.client_id)
  const skResponse = await checkMidSession(session.skSession)

  if (skResponse.state === 'RUNNING') return { status: 'RUNNING' }
  if (skResponse.result !== 'OK') return { status: skResponse.result }

  // Verify the signature and certificate ourselves rather than trusting the OK result alone
  const identity = await verifyMobileIdResponse(skResponse, session)

  if (identity.idcode !== session.idcode) throw authError('Certificate identity does not match the requested ID code')

  await consumeSession(key)

  const code = await saveUser(identityUser(identity, 'mobile-id'), session)

  return { url: codeRedirectUrl(session, code) }
})

// SK session status; anything other than RUNNING or COMPLETE is an SK error
async function checkMidSession (sessionId) {
  const skResponse = await skFetch(`https://mid.sk.ee/mid-api/authentication/session/${sessionId}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING' || skResponse.state === 'COMPLETE') return skResponse

  throw createError({ statusCode: 400, statusMessage: skResponse.error || 'Mobile-ID session check failed' })
}
