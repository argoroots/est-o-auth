import { X509Certificate, createHash, constants } from 'crypto'

// Smart-ID RP API v3 response verification, per
// https://sk-eid.github.io/smart-id-documentation/rp-api/response_verification.html

// What we request in smart-id.get.js; the response must not fall below it
const REQUIRED_LEVEL = 'QUALIFIED'
const LEVELS = { ADVANCED: 1, QUALIFIED: 2 }
const REQUESTED_INTERACTIONS = ['displayTextAndPIN']

export async function verifyAndExtractIdentity (skResponse, sidSession) {
  const { signature: sig, cert } = skResponse

  if (skResponse.signatureProtocol !== 'ACSP_V2' || sig?.signatureAlgorithm !== 'rsassa-pss') throw authError('Unexpected signature protocol')
  if (!REQUESTED_INTERACTIONS.includes(skResponse.interactionTypeUsed)) throw authError('Unexpected interaction type')
  if ((LEVELS[cert?.certificateLevel] ?? 0) < LEVELS[REQUIRED_LEVEL]) throw authError('Certificate level is below the required level')

  const x509 = new X509Certificate(Buffer.from(cert.value, 'base64'))

  await checkTrustedCertificate(x509, 'smart-id')

  // ACSP_V2 payload: 'smart-id'|'ACSP_V2'|serverRandom|rpChallenge|userChallenge|B64(rpName)|B64(brokeredRpName)|B64(SHA-256(interactions))|interactionTypeUsed|initialCallbackUrl|flowType
  // Smart-ID includes initialCallbackUrl in the signed payload only for the Web2App flow
  const config = useRuntimeConfig()
  const payload = [
    'smart-id',
    'ACSP_V2',
    sig.serverRandom,
    sidSession.rpChallenge,
    sig.userChallenge ?? '',
    Buffer.from(config.skidName).toString('base64'),
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

  return getCertificateIdentity(x509).idcode
}
