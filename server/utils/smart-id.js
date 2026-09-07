import { X509Certificate, createHash, verify, constants } from 'crypto'

// Certificate level we request from Smart-ID; the returned certificate must meet or exceed it
const REQUIRED_LEVEL = 'QUALIFIED'
const LEVELS = { ADVANCED: 1, QUALIFIED: 2 }

export async function verifyAndExtractIdentity (skResponse, sidSession) {
  const config = useRuntimeConfig()
  const { signature: sig, cert } = skResponse

  if (skResponse.signatureProtocol !== 'ACSP_V2') {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected signature protocol' })
  }

  // Assurance level of the returned certificate (per RP API v3 session status response)
  if ((LEVELS[cert.certificateLevel] ?? 0) < LEVELS[REQUIRED_LEVEL]) {
    throw createError({ statusCode: 400, statusMessage: 'Certificate level is below the required level' })
  }

  const x509 = new X509Certificate(Buffer.from(cert.value, 'base64'))

  // Validity period and chain to a pinned Smart-ID CA
  await checkTrustedCertificate(x509, 'smart-id')

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

  return getCertificateIdentity(x509).idcode
}
