import { createHash } from 'crypto'

// Smart-ID Web2App return endpoint. The user arrives here from the Smart-ID app, so once the session
// is known every failure is reported to the client's redirect_uri per RFC 6749 §4.1.2.1 instead of
// rendering an error page in the user's browser.
export default defineEventHandler(async (event) => {
  const { session, value, sessionSecretDigest, userChallengeVerifier } = getQuery(event)

  if (!session || !value || !sessionSecretDigest || !userChallengeVerifier) {
    throw createError({ statusCode: 400, statusMessage: 'Missing callback parameters' })
  }

  const sidSession = await getSessionData(`smart-id:${session}`, false, SESSION_TTL.SK)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid or expired session' })

  try {
    const idcode = await completeSession(sidSession, { value, sessionSecretDigest, userChallengeVerifier })

    // Consume the session exactly once; a concurrent completion loses here
    if (!await getSessionData(`smart-id:${session}`, true)) throw createError({ statusCode: 403, statusMessage: 'Session already used' })

    const code = await saveUser({
      id: idcode,
      email: `${idcode}@eesti.ee`,
      provider: 'smart-id'
    }, sidSession)

    const search = new URLSearchParams({ code, state: sidSession.state }).toString()

    return sendRedirect(event, `${sidSession.redirect_uri}?${search}`)
  }
  catch (error) {
    console.warn(`[warn] ${error.statusCode ?? 500} GET /api/smart-id-callback client=${sidSession.client_id} provider=smart-id: ${logSafe(error.statusMessage || error.message)}`)

    // Smart-ID reports a user cancellation as USER_REFUSED, USER_REFUSED_DISPLAYTEXTANDPIN, ...
    const providerError = /^USER_REFUSED/.test(error.statusMessage ?? '') ? 'access_denied' : undefined

    return sendRedirect(event, providerErrorUrl({ uri: sidSession.redirect_uri, state: sidSession.state }, providerError))
  }
})

// Runs the Web2App checks from the Smart-ID RP API v3 response verification guide and returns the
// verified ID code. Throws on any failure.
async function completeSession (sidSession, { value, sessionSecretDigest, userChallengeVerifier }) {
  // Step 1: Anti-phishing value check
  if (value !== sidSession.callbackValue) throw createError({ statusCode: 403, statusMessage: 'Invalid callback value' })

  // Step 1: sessionSecretDigest = Base64URL(SHA-256(Base64Decode(sessionSecret)))
  const expectedDigest = createHash('sha256')
    .update(Buffer.from(sidSession.sessionSecret, 'base64'))
    .digest('base64url')
    .replace(/=+$/, '')

  if (sessionSecretDigest !== expectedDigest) throw createError({ statusCode: 403, statusMessage: 'Invalid session secret digest' })

  const skResponse = await skFetch(`https://rp-api.smart-id.com/v3/session/${sidSession.skSession}?timeoutMs=10000`)

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw createError({ statusCode: 400, statusMessage: skResponse.result?.endResult || 'Smart-ID authentication failed' })
  }

  // Step 3: Base64URL(SHA-256(userChallengeVerifier)) must match signature.userChallenge
  const computedUserChallenge = createHash('sha256')
    .update(userChallengeVerifier)
    .digest('base64url')
    .replace(/=+$/, '')

  if (computedUserChallenge !== skResponse.signature?.userChallenge) throw createError({ statusCode: 403, statusMessage: 'Invalid user challenge verifier' })

  return await verifyAndExtractIdentity(skResponse, sidSession)
}
