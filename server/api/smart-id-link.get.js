import { createHmac } from 'crypto'

// QR links are valid for the second they were computed for, so the page needs a new one every
// second. Return a batch instead of one, so the page fetches once per QR_BATCH_SECONDS.
const QR_BATCH_SECONDS = 30

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (!query.session) throw createError({ statusCode: 400, statusMessage: 'Missing session' })

  const config = useRuntimeConfig()
  const sidSession = await getSessionData(`smart-id:${query.session}`, false, SESSION_TTL.SK)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid or expired session' })

  const { sessionToken, sessionSecret, deviceLinkBase, rpChallenge, interactions, initialCallbackUrl, startTime, lang = 'eng' } = sidSession
  const rpNameB64 = Buffer.from(config.skidName).toString('base64')
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

  // QR links, one per upcoming second; initialCallbackUrl is always empty for QR authCode per spec
  const qrUrls = Array.from({ length: QR_BATCH_SECONDS }, (_, i) => {
    const qrBase = `${deviceLinkBase}?deviceLinkType=QR&elapsedSeconds=${elapsedSeconds + i}&sessionToken=${sessionToken}&sessionType=auth&version=1.0&lang=${lang}`
    const qrAuthCode = computeAuthCode(sessionSecret, `smart-id|ACSP_V2|${rpChallenge}|${rpNameB64}||${interactions}||${qrBase}`)

    return `${qrBase}&authCode=${qrAuthCode}`
  })

  // Same-device Web2App link — includes initialCallbackUrl in authCode payload per spec
  const webBase = `${deviceLinkBase}?deviceLinkType=Web2App&sessionToken=${sessionToken}&sessionType=auth&version=1.0&lang=${lang}`
  const webAuthCode = computeAuthCode(sessionSecret, `smart-id|ACSP_V2|${rpChallenge}|${rpNameB64}||${interactions}|${initialCallbackUrl}|${webBase}`)
  const deviceLinkUrl = `${webBase}&authCode=${webAuthCode}`

  return { qrUrls, deviceLinkUrl }
})

function computeAuthCode (sessionSecret, payload) {
  return createHmac('sha256', Buffer.from(sessionSecret, 'base64'))
    .update(payload)
    .digest('base64url')
    .replace(/=+$/, '')
}
