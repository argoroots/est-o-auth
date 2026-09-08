import { X509Certificate, createHash, verify, constants } from 'crypto'
import * as pkijs from 'pkijs'

// Web eID token validation, per https://github.com/web-eid/web-eid-system-architecture-doc#authentication-token-validation

// Mobile-ID certificates (1.3.6.1.4.1.10015.1.3.*) chain to the same CA but are not smart cards
const DISALLOWED_POLICY_PREFIX = '1.3.6.1.4.1.10015.1.3'
const CERTIFICATE_POLICIES_OID = '2.5.29.32'
const CLIENT_AUTH_OID = '1.3.6.1.5.5.7.3.2'

// True when the certificate carries a policy that is not accepted for ID-card login
function hasDisallowedPolicy (x509) {
  const cert = pkijs.Certificate.fromBER(new Uint8Array(x509.raw).buffer)
  const extension = cert.extensions?.find((ext) => ext.extnID === CERTIFICATE_POLICIES_OID)
  const policies = extension?.parsedValue?.certificatePolicies?.map((p) => p.policyIdentifier) ?? []

  return policies.some((oid) => oid === DISALLOWED_POLICY_PREFIX || oid.startsWith(`${DISALLOWED_POLICY_PREFIX}.`))
}

// Verifies a Web eID token (format, usage, policy, chain, OCSP, signature over hash(origin)||hash(nonce)) and returns the certificate
export async function verifyWebEidToken (token, nonce, origin) {
  const { unverifiedCertificate, algorithm, signature, format } = token ?? {}

  // Minor versions within web-eid:1 are backwards compatible
  if (!/^web-eid:1(\.\d+)?$/.test(format ?? '')) throw authError('Unsupported authentication token format')

  const match = /^(ES|PS|RS)(256|384|512)$/.exec(algorithm ?? '')

  if (!match || !unverifiedCertificate || !signature) throw authError('Invalid authentication token')

  const [, family, bits] = match
  const hashAlg = `sha${bits}`

  let cert

  try {
    cert = new X509Certificate(Buffer.from(unverifiedCertificate, 'base64'))
  }
  catch {
    throw authError('Invalid certificate')
  }

  if (!cert.keyUsage?.includes(CLIENT_AUTH_OID)) throw authError('Certificate is not for authentication')
  if (hasDisallowedPolicy(cert)) throw authError('Certificate policy is not allowed for ID-card authentication')

  const issuer = await checkTrustedCertificate(cert, 'id-card')

  await checkRevocation(cert, issuer.cert, issuer.ocsp)

  const data = Buffer.concat([
    createHash(hashAlg).update(origin, 'utf8').digest(),
    createHash(hashAlg).update(nonce, 'utf8').digest()
  ])

  // EC signatures are raw R||S
  const keyOptions = { key: cert.publicKey }

  if (family === 'ES') keyOptions.dsaEncoding = 'ieee-p1363'
  if (family === 'PS') Object.assign(keyOptions, { padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST })
  if (family === 'RS') keyOptions.padding = constants.RSA_PKCS1_PADDING

  if (!safeVerify(hashAlg, data, keyOptions, Buffer.from(signature, 'base64'))) throw authError('Signature verification failed')

  return cert
}

// crypto.verify that treats malformed input the same as a bad signature
export function safeVerify (hashAlg, data, keyOptions, signature) {
  try {
    return verify(hashAlg, data, keyOptions, signature)
  }
  catch {
    return false
  }
}
