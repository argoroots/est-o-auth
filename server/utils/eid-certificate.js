import { X509Certificate } from 'crypto'

// Trusted issuing CAs per method; PEM files from https://www.skidsolutions.eu/resources/certificates/ (Intermediate CAs)
const TRUSTED_ISSUERS = {
  // Physical ID-cards (Web eID); ocsp is SK's public AIA responder for that CA
  'id-card': [
    { file: 'esteid2018.pem.crt', ocsp: 'http://aia.sk.ee/esteid2018' },
    { file: 'ESTEID-SK_2015.pem.crt', ocsp: 'http://aia.sk.ee/esteid2015' }
  ],
  // Smart-ID QUALIFIED accounts (E = active issuing CA, R = backup CA)
  'smart-id': [
    { file: 'EID_Q_2024E.pem.crt' },
    { file: 'EID_Q_2024R.pem.crt' },
    { file: 'EID_Q_2021E.pem.crt' },
    { file: 'EID_Q_2021R.pem.crt' }
  ],
  // Mobile-ID, per https://github.com/SK-EID/MID/wiki/Environment-technical-parameters
  'mobile-id': [
    { file: 'EID_Q_2021E.pem.crt' },
    { file: 'EID-SK_2016.pem.crt' },
    { file: 'ESTEID-SK_2015.pem.crt' }
  ]
}

const cache = {}

// Loads and caches the trusted issuer certificates for a method
async function getTrustedIssuers (method) {
  if (cache[method]) return cache[method]

  const storage = useStorage('assets:server')
  const entries = TRUSTED_ISSUERS[method]

  if (!entries) throw new Error(`No trusted issuers configured for ${method}`)

  cache[method] = await Promise.all(entries.map(async ({ file, ocsp }) => {
    const pem = await storage.getItem(`certs/${file}`)

    if (!pem) throw new Error(`Missing trusted issuer certificate ${file}`)

    return { cert: new X509Certificate(pem), ocsp }
  }))

  return cache[method]
}

// Checks validity period and that a trusted CA for the method issued and signed the certificate; returns that issuer, `context` is appended to the failure log
export async function checkTrustedCertificate (cert, method, context = '') {
  const now = new Date()

  if (now < new Date(cert.validFrom)) throw authError('cert.notYetValid')
  if (now > new Date(cert.validTo)) throw authError('cert.expired')

  const issuers = await getTrustedIssuers(method)
  const issuer = issuers.find(({ cert: ca }) => cert.checkIssued(ca))

  // The issuer name is the CA, not personal data; it tells which CA to add when SK starts using a new one
  if (!issuer || !cert.verify(issuer.cert.publicKey)) {
    console.warn(`[cert] ${method} certificate issuer not trusted: ${logSafe(cert.issuer.replaceAll('\n', ', '))}${context ? ` ${context}` : ''}`)

    throw authError('cert.untrusted')
  }

  return issuer
}

// Estonian personal code and name from an SK certificate subject (serialNumber=PNOEE-<11 digits>, GN, SN)
export function getCertificateIdentity (cert) {
  const subject = Object.fromEntries(cert.subject.split('\n').map((x) => x.split('=')))
  const match = /^PNOEE-(\d{11})$/.exec(subject.serialNumber ?? '')

  if (!match) throw authError('cert.identity')

  return { idcode: match[1], givenName: subject.GN, surname: subject.SN }
}

// User record for an eID identity: ID code as id, the conventional @eesti.ee address, full name when known
export function identityUser ({ idcode, givenName, surname }, provider) {
  return {
    id: idcode,
    email: `${idcode}@eesti.ee`,
    name: givenName && surname ? `${givenName} ${surname}` : undefined,
    provider
  }
}
