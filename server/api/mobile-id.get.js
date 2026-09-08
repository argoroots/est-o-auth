import { randomUUID, randomBytes, createHash } from 'crypto'

// Starts a Mobile-ID login: opens an SK session and returns the control code to show and our session id
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'mobile-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'idcode', 'phone'])

  if (!isIdcode(query.idcode)) throw apiError(400, 'invalid.idcode')
  if (!isPhone(query.phone)) throw apiError(400, 'invalid.phone')

  await checkUsageLimit(client.id, 'mobile-id')

  // Starting a session prompts the phone of the person with this ID code; one prompt per minute per person
  await checkCooldown('mobile-id', query.idcode, 60 * 1000)

  const locale = getLocale(query.lang)
  const { skSession, consent, message } = await startMidSession(query.idcode, query.phone, client.skidText || locale.common.logIn, locale.mobileId.language)
  const session = randomUUID().replaceAll('-', '')

  await setSessionData(`mobile-id:${session}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    idcode: query.idcode,
    phone: query.phone,
    skSession,
    message
  }, SESSION_TTL.SK)

  await recordUsage(client, 'mobile-id')

  return { consent, session }
})

// Starts an SK Mobile-ID authentication session, per https://github.com/SK-EID/MID#authentication
async function startMidSession (idcode, phone, displayText, language) {
  const config = useRuntimeConfig()

  // The SIM signs the hash we send; the message is kept so the signature can be verified later
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

  if (!skSession) {
    console.warn(`[sk] Mobile-ID start: ${logSafe(error)}`)

    throw apiError(400, 'mid.startFailed')
  }

  return { skSession, consent: verificationCode(hash), message: message.toString('base64') }
}

// Control code shown to the user: 6 bits from the start of the hash and 7 bits from its end, as 4 digits
function verificationCode (hash) {
  const value = ((hash[0] >> 2) << 7) | (hash[hash.length - 1] & 0x7f)

  return String(value).padStart(4, '0')
}
