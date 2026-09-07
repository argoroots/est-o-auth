import { randomUUID, randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])
  const session = randomUUID().replaceAll('-', '')
  const callbackValue = randomBytes(16).toString('base64url')
  const initialCallbackUrl = `${getOrigin(event)}/api/smart-id-callback?session=${session}&value=${callbackValue}`

  await checkUsageLimit(client.id, 'smart-id')

  const result = await startSidSession(client.skidText || getLocale(query.lang).common.logIn, initialCallbackUrl)

  await setSessionData(`smart-id:${session}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    lang: getLocale(query.lang).smartId.language,
    skSession: result.skSession,
    sessionToken: result.sessionToken,
    sessionSecret: result.sessionSecret,
    deviceLinkBase: result.deviceLinkBase,
    rpChallenge: result.rpChallenge,
    interactions: result.interactions,
    initialCallbackUrl,
    callbackValue,
    startTime: result.startTime
  })

  await setBillingUsage(client.stripeId, 'smart-id')
  await setUsage(client.id, 'smart-id')

  return { session }
})

async function startSidSession (displayText60, initialCallbackUrl) {
  const config = useRuntimeConfig()

  const rpChallenge = randomBytes(64).toString('base64')

  const interactionsArray = [
    { type: 'displayTextAndPIN', displayText60 }
  ]
  const interactions = Buffer.from(JSON.stringify(interactionsArray)).toString('base64')

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
