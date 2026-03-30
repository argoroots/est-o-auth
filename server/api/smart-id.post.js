import { X509Certificate, createHash, verify, constants } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'smart-id', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'session'])
  await getClient(body)

  const sidSession = await getSessionData(`smart-id:${body.session}`, false)

  if (!sidSession) throw createError({ statusCode: 403, statusMessage: 'Invalid session' })

  const skResponse = await $fetch(`https://rp-api.smart-id.com/v3/session/${sidSession.skSession}?timeoutMs=2000`)

  if (skResponse.state === 'RUNNING') return { status: 'RUNNING' }

  if (skResponse.state !== 'COMPLETE' || skResponse.result?.endResult !== 'OK') {
    throw createError({ statusCode: 400, statusMessage: skResponse.result?.endResult || 'Smart-ID authentication failed' })
  }

  const idcode = verifyAndExtractIdentity(skResponse, sidSession)

  await getSessionData(`smart-id:${body.session}`, true)

  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    provider: 'smart-id'
  })

  const search = new URLSearchParams({ code, state: sidSession.state }).toString()

  return { url: `${sidSession.redirect_uri}?${search}` }
})

function verifyAndExtractIdentity (skResponse, sidSession) {
  const config = useRuntimeConfig()
  const { signature: sig, cert } = skResponse

  if (skResponse.signatureProtocol !== 'ACSP_V2') {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected signature protocol' })
  }

  // Parse certificate and extract national identity code
  const x509 = new X509Certificate(Buffer.from(cert.value, 'base64'))
  const match = x509.subject.match(/SERIALNUMBER=PNO\w{2}-(\d+)/i)

  if (!match) throw createError({ statusCode: 400, statusMessage: 'Could not extract identity from certificate' })

  const idcode = match[1]

  // ACSP_V2 signature verification
  const { rpChallenge, interactions } = sidSession
  const rpNameB64 = Buffer.from(config.skidName).toString('base64')
  const interactionsDigest = createHash('sha256').update(interactions).digest('base64')

  const payload = [
    'smart-id',
    'ACSP_V2',
    sig.serverRandom,
    rpChallenge,
    sig.userChallenge ?? '',
    rpNameB64,
    '',
    interactionsDigest,
    skResponse.interactionTypeUsed,
    '',
    sig.flowType
  ].join('|')

  const hashAlg = (sig.signatureAlgorithmParameters?.hashAlgorithm || 'SHA-512').toLowerCase().replace('-', '')
  const saltLength = sig.signatureAlgorithmParameters?.saltLength ?? constants.RSA_PSS_SALTLEN_MAX_SIGN

  const isValid = verify(
    hashAlg,
    Buffer.from(payload),
    { key: x509.publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength },
    Buffer.from(sig.value, 'base64')
  )

  if (!isValid) throw createError({ statusCode: 400, statusMessage: 'Signature verification failed' })

  return idcode
}
