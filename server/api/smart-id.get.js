import { randomUUID, randomBytes, createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  checkRequest(query, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode'])

  const client = getClient(query)
  const session = randomUUID().replaceAll('-', '')

  const { skSession, consent } = await startSidSession(query.idcode, client.skidText)

  await setSessionData(`smart-id:${query.idcode}:${session}`, {
    redirect_uri: query.redirect_uri,
    state: query.state,
    idcode: query.idcode,
    skSession
  })

  await setUsage(client.id, 'smart-id')

  return { consent, session }
})

async function startSidSession (idcode, displayText60) {
  const config = useRuntimeConfig()
  const hash = randomBytes(64)
  const digest = createHash('sha512').update(hash).digest('base64')
  const sha256HashedInput = createHash('sha256').update(Buffer.from(digest, 'base64')).digest()
  const integer = sha256HashedInput.readUIntBE(sha256HashedInput.length - 2, 2)
  const consent = String((integer % 10000).toString()).padStart(4, '0')

  const { sessionID: skSession, error } = await $fetch(`https://rp-api.smart-id.com/v2/authentication/etsi/PNOEE-${idcode}`, {
    method: 'POST',
    body: {
      relyingPartyName: config.skidName,
      relyingPartyUUID: config.skidUuid,
      hash: digest,
      hashType: 'SHA512',
      allowedInteractionsOrder: [
        { type: 'displayTextAndPIN', displayText60 },
        { type: 'verificationCodeChoice', displayText60 }
      ]
    }
  })

  if (!skSession) throw createError({ statusCode: 400, statusMessage: error || 'Smart-ID session start failed' })

  return {
    consent,
    skSession
  }
}
