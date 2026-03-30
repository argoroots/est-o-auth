import { X509Certificate, createHash, verify, constants } from 'crypto'

export function verifyAndExtractIdentity (skResponse, sidSession) {
  const config = useRuntimeConfig()
  const { signature: sig, cert } = skResponse

  if (skResponse.signatureProtocol !== 'ACSP_V2') {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected signature protocol' })
  }

  const x509 = new X509Certificate(Buffer.from(cert.value, 'base64'))
  const match = x509.subject.match(/SERIALNUMBER=PNO\w{2}-(\d+)/i)

  if (!match) throw createError({ statusCode: 400, statusMessage: 'Could not extract identity from certificate' })

  const idcode = match[1]

  const { rpChallenge, interactions } = sidSession
  const initialCallbackUrl = sig.flowType === 'Web2App' ? sidSession.initialCallbackUrl : ''
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
    initialCallbackUrl,
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
