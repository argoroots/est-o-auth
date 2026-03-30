import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const { session, value, sessionSecretDigest, userChallengeVerifier } = getQuery(event)

  if (!session || !value || !sessionSecretDigest || !userChallengeVerifier) {
    throw createError({ statusCode: 400, statusMessage: 'Missing callback parameters' })
  }

  const sidSession = await getSessionData(`smart-id:${session}`, false)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid or expired session' })

  // Step 1: Anti-phishing value check
  if (value !== sidSession.callbackValue) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid callback value' })
  }

  // Step 1: sessionSecretDigest = Base64URL(SHA-256(Base64Decode(sessionSecret)))
  const expectedDigest = createHash('sha256')
    .update(Buffer.from(sidSession.sessionSecret, 'base64'))
    .digest('base64url')
    .replace(/=+$/, '')

  if (sessionSecretDigest !== expectedDigest) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid session secret digest' })
  }

  const skResponse = await $fetch(`https://rp-api.smart-id.com/v3/session/${sidSession.skSession}?timeoutMs=10000`)

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw createError({ statusCode: 400, statusMessage: skResponse.result?.endResult || 'Smart-ID authentication failed' })
  }

  // Step 3: Base64URL(SHA-256(userChallengeVerifier)) must match signature.userChallenge
  const computedUserChallenge = createHash('sha256')
    .update(userChallengeVerifier)
    .digest('base64url')
    .replace(/=+$/, '')

  if (computedUserChallenge !== skResponse.signature?.userChallenge) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid user challenge verifier' })
  }

  const idcode = verifyAndExtractIdentity(skResponse, sidSession)

  await getSessionData(`smart-id:${session}`, true)

  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    provider: 'smart-id'
  })

  const search = new URLSearchParams({ code, state: sidSession.state }).toString()

  return sendRedirect(event, `${sidSession.redirect_uri}?${search}`)
})
