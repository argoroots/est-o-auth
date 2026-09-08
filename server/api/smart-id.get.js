import { randomUUID, randomBytes } from 'crypto'

// Starts a Smart-ID login: opens an anonymous device-link SK session and returns our session id
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  await checkUsageLimit(client.id, 'smart-id')

  const session = randomUUID().replaceAll('-', '')
  const callbackValue = randomBytes(16).toString('base64url')
  const initialCallbackUrl = `${getOrigin(event)}/api/smart-id-callback?session=${session}&value=${callbackValue}`
  const locale = getLocale(query.lang)
  const result = await startSidSession(client.skidText || locale.common.logIn, initialCallbackUrl)

  await setSessionData(`smart-id:${session}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    lang: locale.smartId.language,
    initialCallbackUrl,
    callbackValue,
    ...result
  }, SESSION_TTL.SK)

  await recordUsage(client, 'smart-id')

  return { session }
})

// Starts an SK Smart-ID v3 anonymous device-link session and returns what the links and verification need
async function startSidSession (displayText60, initialCallbackUrl) {
  const config = useRuntimeConfig()
  const rpChallenge = randomBytes(64).toString('base64')
  const interactions = Buffer.from(JSON.stringify([{ type: 'displayTextAndPIN', displayText60 }])).toString('base64')

  const response = await skFetch('https://rp-api.smart-id.com/v3/authentication/device-link/anonymous', {
    method: 'POST',
    body: {
      relyingPartyName: config.skidName,
      relyingPartyUUID: config.skidUuid,
      initialCallbackUrl,
      signatureProtocol: 'ACSP_V2',
      signatureProtocolParameters: {
        rpChallenge,
        signatureAlgorithm: 'rsassa-pss',
        signatureAlgorithmParameters: { hashAlgorithm: 'SHA-256' }
      },
      interactions,
      certificateLevel: 'QUALIFIED'
    }
  })

  const { sessionID: skSession, sessionToken, sessionSecret, deviceLinkBase, error } = response

  if (!skSession) throw createError({ statusCode: 400, statusMessage: error || 'Smart-ID session start failed' })

  return { skSession, sessionToken, sessionSecret, deviceLinkBase, rpChallenge, interactions, startTime: Date.now() }
}
