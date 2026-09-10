import { createHmac } from 'crypto'

// Smart-ID device links for a session: the QR link for this second and the same-device Web2App link; SK forbids generating authCodes ahead of time, so the page asks every second
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (!query.session) throw apiError(400, 'missing.session')

  const session = await requireSession(`smart-id:${query.session}`, SESSION_TTL.SK)
  const { sessionToken, sessionSecret, deviceLinkBase, rpChallenge, interactions, initialCallbackUrl, startTime, lang = 'eng' } = session
  const rpNameB64 = Buffer.from(useRuntimeConfig().skidName).toString('base64')
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

  // Signed link for a device link type; QR links carry elapsedSeconds and never the callback URL
  const link = (type, params, callbackUrl) => {
    const base = `${deviceLinkBase}?deviceLinkType=${type}&${params}sessionToken=${sessionToken}&sessionType=auth&version=1.0&lang=${lang}`
    const authCode = computeAuthCode(sessionSecret, `smart-id|ACSP_V2|${rpChallenge}|${rpNameB64}||${interactions}|${callbackUrl}|${base}`)

    return `${base}&authCode=${authCode}`
  }

  return {
    qrUrl: link('QR', `elapsedSeconds=${elapsedSeconds}&`, ''),
    deviceLinkUrl: link('Web2App', '', initialCallbackUrl)
  }
})

// HMAC-SHA256 auth code over the link payload, keyed with the session secret, unpadded base64url
function computeAuthCode (sessionSecret, payload) {
  return createHmac('sha256', Buffer.from(sessionSecret, 'base64'))
    .update(payload)
    .digest('base64url')
    .replace(/=+$/, '')
}
