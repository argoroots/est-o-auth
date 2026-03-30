import { randomUUID, randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(query)
  const session = randomUUID().replaceAll('-', '')
  const callbackValue = randomBytes(16).toString('base64url')
  const origin = getRequestURL(event).origin
  const initialCallbackUrl = `${origin}/api/smart-id-callback?session=${session}&value=${callbackValue}`

  const result = await startSidSession(client.skidText, initialCallbackUrl)

  await setSessionData(`smart-id:${session}`, {
    redirect_uri: query.redirect_uri,
    state: query.state,
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
    { type: 'displayTextAndPIN', displayText60: displayText60 || 'Log in' }
  ]
  const interactions = Buffer.from(JSON.stringify(interactionsArray)).toString('base64')

  const response = await $fetch('https://rp-api.smart-id.com/v3/authentication/device-link/anonymous', {
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
