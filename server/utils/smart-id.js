import { X509Certificate, createHash, constants } from 'crypto'

// Smart-ID RP API v3 response verification, per https://sk-eid.github.io/smart-id-documentation/rp-api/response_verification.html

// What smart-id.get.js requests; the response must not fall below it
const REQUIRED_LEVEL = 'QUALIFIED'
const LEVELS = { ADVANCED: 1, QUALIFIED: 2 }
const REQUESTED_INTERACTIONS = ['displayTextAndPIN']

// Verifies a completed Smart-ID session (protocol, level, certificate chain, ACSP_V2 signature) and returns the identity
export async function verifySmartIdResponse (skResponse, sidSession) {
  const { signature: sig, cert } = skResponse

  if (skResponse.signatureProtocol !== 'ACSP_V2' || sig?.signatureAlgorithm !== 'rsassa-pss') throw authError('Unexpected signature protocol')
  if (!REQUESTED_INTERACTIONS.includes(skResponse.interactionTypeUsed)) throw authError('Unexpected interaction type')
  if ((LEVELS[cert?.certificateLevel] ?? 0) < LEVELS[REQUIRED_LEVEL]) throw authError('Certificate level is below the required level')

  const x509 = new X509Certificate(Buffer.from(cert.value, 'base64'))

  await checkTrustedCertificate(x509, 'smart-id')

  // ACSP_V2 payload; initialCallbackUrl is part of it only for the Web2App flow
  const payload = [
    'smart-id',
    'ACSP_V2',
    sig.serverRandom,
    sidSession.rpChallenge,
    sig.userChallenge ?? '',
    Buffer.from(useRuntimeConfig().skidName).toString('base64'),
    '',
    createHash('sha256').update(sidSession.interactions).digest('base64'),
    skResponse.interactionTypeUsed,
    sig.flowType === 'Web2App' ? sidSession.initialCallbackUrl : '',
    sig.flowType
  ].join('|')

  const { hashAlgorithm, saltLength } = sig.signatureAlgorithmParameters ?? {}
  const hashAlg = hashAlgorithm?.toLowerCase().replace('-', '')

  if (!/^sha(256|384|512)$/.test(hashAlg ?? '')) throw authError('Unsupported signature hash algorithm')

  const keyOptions = { key: x509.publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: saltLength ?? constants.RSA_PSS_SALTLEN_DIGEST }

  if (!safeVerify(hashAlg, Buffer.from(payload), keyOptions, Buffer.from(sig.value, 'base64'))) throw authError('Signature verification failed')

  return getCertificateIdentity(x509)
}
