import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (!query.session) throw createError({ statusCode: 400, statusMessage: 'Missing session' })

  const config = useRuntimeConfig()
  const sidSession = await getSessionData(`smart-id-qr:${query.session}`, false)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid session' })

  const { sessionToken, sessionSecret, deviceLinkBase, rpChallenge, interactions, startTime } = sidSession
  const rpNameB64 = Buffer.from(config.skidName).toString('base64')
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

  // QR link — elapsedSeconds changes every second, so authCode must be recomputed
  const qrBase = `${deviceLinkBase}?deviceLinkType=QR&elapsedSeconds=${elapsedSeconds}&sessionToken=${sessionToken}&sessionType=auth&version=1.0&lang=eng`
  const qrAuthCode = computeAuthCode(sessionSecret, `smart-id|ACSP_V2|${rpChallenge}|${rpNameB64}||${interactions}||${qrBase}`)
  const qrUrl = `${qrBase}&authCode=${qrAuthCode}`

  // Same-device Web2App link — no elapsedSeconds, static authCode
  const webBase = `${deviceLinkBase}?deviceLinkType=Web2App&sessionToken=${sessionToken}&sessionType=auth&version=1.0&lang=eng`
  const webAuthCode = computeAuthCode(sessionSecret, `smart-id|ACSP_V2|${rpChallenge}|${rpNameB64}||${interactions}||${webBase}`)
  const deviceLinkUrl = `${webBase}&authCode=${webAuthCode}`

  return { qrUrl, deviceLinkUrl }
})

function computeAuthCode (sessionSecret, payload) {
  return createHmac('sha256', Buffer.from(sessionSecret, 'base64'))
    .update(payload)
    .digest('base64url')
    .replace(/=+$/, '')
}
