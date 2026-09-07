import { X509Certificate, createHash, verify, constants } from 'crypto'
import * as pkijs from 'pkijs'

// Certificate policies that must not be accepted for ID-card authentication: Estonian Mobile-ID
// certificates (1.3.6.1.4.1.10015.1.3 and its versioned sub-policies) were issued by the same CA
// as ID-cards, so they chain fine but are not smart cards. Mirrors the Web eID reference validator.
const DISALLOWED_POLICY_PREFIXES = ['1.3.6.1.4.1.10015.1.3']
const CERTIFICATE_POLICIES_OID = '2.5.29.32'

// OID for TLS Web Client Authentication extended key usage
const CLIENT_AUTH_OID = '1.3.6.1.5.5.7.3.2'

// Nonce validity window
export const WEB_EID_NONCE_TTL_MS = 5 * 60 * 1000

function fail (message) {
  return createError({ statusCode: 400, statusMessage: message })
}

function hasDisallowedPolicy (x509) {
  const cert = pkijs.Certificate.fromBER(new Uint8Array(x509.raw).buffer)
  const extension = cert.extensions?.find((ext) => ext.extnID === CERTIFICATE_POLICIES_OID)
  const policies = extension?.parsedValue?.certificatePolicies?.map((p) => p.policyIdentifier) ?? []

  return policies.some((oid) => DISALLOWED_POLICY_PREFIXES.some((prefix) => oid === prefix || oid.startsWith(`${prefix}.`)))
}

// Verifies a Web eID authentication token (format web-eid:1.0) and returns the user certificate.
// Signed data is hash(origin) || hash(nonce), hash taken from the algorithm suffix (ES384 -> SHA-384).
export async function verifyWebEidToken (token, nonce, origin) {
  const { unverifiedCertificate, algorithm, signature, format } = token ?? {}

  // Minor versions within web-eid:1 are backwards compatible (1.1 adds optional fields we do not use)
  if (!/^web-eid:1(\.\d+)?$/.test(format ?? '')) throw fail('Unsupported authentication token format')
  if (!unverifiedCertificate || !algorithm || !signature) throw fail('Incomplete authentication token')

  const match = /^(ES|PS|RS)(256|384|512)$/.exec(algorithm)

  if (!match) throw fail('Unsupported signature algorithm')

  const [, family, bits] = match
  const hashAlg = `sha${bits}`

  let cert

  try {
    cert = new X509Certificate(Buffer.from(unverifiedCertificate, 'base64'))
  }
  catch {
    throw fail('Invalid certificate')
  }

  if (!cert.keyUsage?.includes(CLIENT_AUTH_OID)) throw fail('Certificate is not for authentication')
  if (hasDisallowedPolicy(cert)) throw fail('Certificate policy is not allowed for ID-card authentication')

  // Validity period and chain to a pinned ID-card CA
  const issuer = await checkTrustedCertificate(cert, 'id-card')

  await checkRevocation(cert, issuer.cert, issuer.ocsp)

  const data = Buffer.concat([
    createHash(hashAlg).update(origin, 'utf8').digest(),
    createHash(hashAlg).update(nonce, 'utf8').digest()
  ])

  const keyOptions = { key: cert.publicKey }

  if (family === 'ES') keyOptions.dsaEncoding = 'ieee-p1363'
  if (family === 'PS') {
    keyOptions.padding = constants.RSA_PKCS1_PSS_PADDING
    keyOptions.saltLength = constants.RSA_PSS_SALTLEN_DIGEST
  }
  if (family === 'RS') keyOptions.padding = constants.RSA_PKCS1_PADDING

  let isValid

  try {
    isValid = verify(hashAlg, data, keyOptions, Buffer.from(signature, 'base64'))
  }
  catch {
    isValid = false
  }

  if (!isValid) throw fail('Signature verification failed')

  return cert
}
