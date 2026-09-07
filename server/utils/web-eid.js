import { X509Certificate, createHash, verify, constants } from 'crypto'
import * as pkijs from 'pkijs'

// Certificate policies that must not be accepted for ID-card authentication: Estonian Mobile-ID
// certificates (1.3.6.1.4.1.10015.1.3 and its versioned sub-policies) were issued by the same CA
// as ID-cards, so they chain fine but are not smart cards. Mirrors the Web eID reference validator.
const DISALLOWED_POLICY_PREFIXES = ['1.3.6.1.4.1.10015.1.3']
const CERTIFICATE_POLICIES_OID = '2.5.29.32'

// Trusted issuers of Estonian ID-card authentication certificates (PEM files in server/assets/certs)
// with SK's public AIA OCSP responder for each, pinned rather than read from the user certificate
const TRUSTED_ISSUERS = [
  { file: 'esteid2018.pem.crt', ocsp: 'http://aia.sk.ee/esteid2018' },
  { file: 'ESTEID-SK_2015.pem.crt', ocsp: 'http://aia.sk.ee/esteid2015' }
]

// OID for TLS Web Client Authentication extended key usage
const CLIENT_AUTH_OID = '1.3.6.1.5.5.7.3.2'

// Nonce validity window
export const WEB_EID_NONCE_TTL_MS = 5 * 60 * 1000

let issuerCerts

async function getIssuerCerts () {
  if (issuerCerts) return issuerCerts

  const storage = useStorage('assets:server')

  issuerCerts = await Promise.all(TRUSTED_ISSUERS.map(async ({ file, ocsp }) => {
    const pem = await storage.getItem(`certs/${file}`)

    if (!pem) throw new Error(`Missing trusted issuer certificate ${file}`)

    return { cert: new X509Certificate(pem), ocsp }
  }))

  return issuerCerts
}

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

  const now = new Date()

  if (now < new Date(cert.validFrom)) throw fail('Certificate is not yet valid')
  if (now > new Date(cert.validTo)) throw fail('Certificate is expired')
  if (!cert.keyUsage?.includes(CLIENT_AUTH_OID)) throw fail('Certificate is not for authentication')
  if (hasDisallowedPolicy(cert)) throw fail('Certificate policy is not allowed for ID-card authentication')

  const issuers = await getIssuerCerts()
  const issuer = issuers.find(({ cert: ca }) => cert.checkIssued(ca))

  if (!issuer || !cert.verify(issuer.cert.publicKey)) throw fail('Certificate is not issued by a trusted authority')

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

// Subject validation: extracts the Estonian personal code from the certificate subject (serialNumber=PNOEE-<11 digits>)
export function getWebEidIdentity (cert) {
  const subject = Object.fromEntries(cert.subject.split('\n').map((x) => x.split('=')))
  const match = /^PNOEE-(\d{11})$/.exec(subject.serialNumber ?? '')

  if (!match || !subject.GN || !subject.SN) throw fail('Could not extract identity from certificate')

  return { idcode: match[1], givenName: subject.GN, surname: subject.SN }
}
