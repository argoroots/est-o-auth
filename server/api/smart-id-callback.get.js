import { createHash } from 'crypto'

// Smart-ID Web2App return: verifies the callback and redirects to the client with a code, or with an error
export default defineEventHandler(async (event) => {
  const { session: sessionId, value, sessionSecretDigest, userChallengeVerifier } = getQuery(event)

  if (!sessionId || !value || !sessionSecretDigest || !userChallengeVerifier) {
    throw apiError(400, 'missing.callbackParams')
  }

  const key = `smart-id:${sessionId}`
  const session = await requireSession(key, SESSION_TTL.SK)

  // The user arrives from the Smart-ID app, so failures go to the client's redirect_uri, not an error page
  try {
    const identity = await completeSession(session, { value, sessionSecretDigest, userChallengeVerifier })

    await consumeSession(key)

    const code = await saveUser(identityUser(identity, 'smart-id'), session)

    return sendRedirect(event, codeRedirectUrl(session, code))
  }
  catch (error) {
    console.warn(`[warn] ${error.statusCode ?? 500} GET /api/smart-id-callback client=${session.client_id} provider=smart-id: ${logSafe(error.statusMessage || error.message)}`)

    const providerError = error.statusMessage === 'sid.refused' ? 'access_denied' : undefined

    return sendRedirect(event, errorRedirectUrl(session, providerError))
  }
})

// Runs the Web2App checks from the Smart-ID response verification guide and returns the verified identity
async function completeSession (session, { value, sessionSecretDigest, userChallengeVerifier }) {
  // Anti-phishing value must be the one we put in the callback URL
  if (value !== session.callbackValue) throw apiError(403, 'invalid.callbackValue')

  // sessionSecretDigest = Base64URL(SHA-256(Base64Decode(sessionSecret)))
  if (sessionSecretDigest !== sha256Base64Url(Buffer.from(session.sessionSecret, 'base64'))) {
    throw apiError(403, 'invalid.sessionSecretDigest')
  }

  const skResponse = await skFetch(`https://rp-api.smart-id.com/v3/session/${session.skSession}?timeoutMs=10000`)

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw sidResultError(skResponse.result?.endResult)
  }

  // Base64URL(SHA-256(userChallengeVerifier)) must match signature.userChallenge
  if (sha256Base64Url(userChallengeVerifier) !== skResponse.signature?.userChallenge) {
    throw apiError(403, 'invalid.userChallenge')
  }

  return await verifySmartIdResponse(skResponse, session)
}

// Unpadded base64url SHA-256, as Smart-ID uses for its digests
function sha256Base64Url (input) {
  return createHash('sha256').update(input).digest('base64url').replace(/=+$/, '')
}
