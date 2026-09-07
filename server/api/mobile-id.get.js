import { randomUUID, randomBytes, createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'phone'])
  const session = randomUUID().replaceAll('-', '')

  await checkUsageLimit(client.id, 'mobile-id')

  // Starting a session prompts the phone of the person with this ID code; one prompt per minute per person
  await checkCooldown(`mobile-id:${query.idcode}`, 60 * 1000)

  const { skSession, consent, message } = await startMidSession(query.idcode, query.phone, client.skidText || getLocale(query.lang).common.logIn, getLocale(query.lang).mobileId.language)

  await setSessionData(`mobile-id:${query.idcode}:${session}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    idcode: query.idcode,
    phone: query.phone,
    skSession,
    message
  })

  await setBillingUsage(client.stripeId, 'mobile-id')
  await setUsage(client.id, 'mobile-id')

  return { consent, session }
})

// Starts a Mobile-ID authentication session, per https://github.com/SK-EID/MID#authentication
async function startMidSession (idcode, phone, displayText, language) {
  const config = useRuntimeConfig()

  // Mobile-ID signs the hash we send; keep the message so the signature can be verified later
  const message = randomBytes(64)
  const hash = createHash('sha256').update(message).digest()

  const { sessionID: skSession, error } = await skFetch('https://mid.sk.ee/mid-api/authentication', {
    method: 'POST',
    body: {
      relyingPartyName: config.skidName,
      relyingPartyUUID: config.skidUuid,
      nationalIdentityNumber: idcode,
      phoneNumber: phone,
      hash: hash.toString('base64'),
      hashType: 'SHA256',
      language,
      // UCS-2 allows any characters (e.g. õ) at up to 50 characters
      displayText: displayText.substring(0, 50),
      displayTextFormat: 'UCS-2'
    }
  })

  if (!skSession) throw createError({ statusCode: 400, statusMessage: error || 'Mobile-ID session start failed' })

  return { skSession, consent: verificationCode(hash), message: message.toString('base64') }
}

// Control code shown to the user: 6 bits from the start of the hash and 7 bits from its end, as a 4-digit number
function verificationCode (hash) {
  const value = ((hash[0] >> 2) << 7) | (hash[hash.length - 1] & 0x7f)

  return String(value).padStart(4, '0')
}
