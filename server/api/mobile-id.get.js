import { randomUUID, randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  await checkRequest(event, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'phone'])

  const client = await getClient(event)
  const query = getQuery(event)
  const session = randomUUID().replaceAll('-', '')

  const { skSession, consent } = await startMidSession(query.idcode, query.phone, client.skidText)

  await setSessionData(`mobile-id:${query.idcode}:${session}`, {
    redirect_uri: query.redirect_uri,
    state: query.state,
    idcode: query.idcode,
    phone: query.phone,
    skSession
  })

  await setUsage(client.id, 'mobile-id')

  return { consent, session }
})

async function startMidSession (idcode, phone, displayText) {
  const config = useRuntimeConfig()
  const hash = randomBytes(32).toString('hex')
  const hashBuffer = Buffer.from(hash, 'hex')
  const binArray = []

  for (const v of hashBuffer.values()) {
    binArray.push(v.toString(2).padStart(8, '0'))
  }

  const bin = binArray.join('')
  const newBinary = bin.substring(0, 6) + bin.slice(-7)
  const consent = String(parseInt(newBinary, 2)).padStart(4, '0')

  const { sessionID: skSession, error } = await $fetch('https://mid.sk.ee/mid-api/authentication', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      relyingPartyName: config.skidName,
      relyingPartyUUID: config.skidUuid,
      nationalIdentityNumber: idcode,
      phoneNumber: phone,
      hash: hashBuffer.toString('base64'),
      hashType: 'SHA256',
      language: 'ENG',
      displayText
    }
  })

  if (!skSession) throw createError({ statusCode: 400, statusMessage: error || 'Mobile-ID session start failed' })

  return {
    consent,
    skSession
  }
}
