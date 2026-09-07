import { X509Certificate } from 'crypto'

// Trusted issuing CAs per authentication method. PEM files live in server/assets/certs and are
// downloaded from https://www.skidsolutions.eu/resources/certificates/ (Intermediate CAs tab).
// ocsp: SK's public AIA responder for that CA (used by the ID-card flow only).
const TRUSTED_ISSUERS = {
  // Physical ID-cards (Web eID)
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

// Checks that the certificate is within its validity period and was issued and signed by one of
// the trusted CAs for the given method. Returns the matching issuer entry { cert, ocsp }.
export async function checkTrustedCertificate (cert, method) {
  const now = new Date()

  if (now < new Date(cert.validFrom)) throw createError({ statusCode: 400, statusMessage: 'Certificate is not yet valid' })
  if (now > new Date(cert.validTo)) throw createError({ statusCode: 400, statusMessage: 'Certificate is expired' })

  const issuers = await getTrustedIssuers(method)
  const issuer = issuers.find(({ cert: ca }) => cert.checkIssued(ca))

  if (!issuer || !cert.verify(issuer.cert.publicKey)) throw createError({ statusCode: 400, statusMessage: 'Certificate is not issued by a trusted authority' })

  return issuer
}

// Extracts the Estonian personal code and name from an SK-issued certificate subject
// (serialNumber=PNOEE-<11 digits>, GN, SN)
export function getCertificateIdentity (cert) {
  const subject = Object.fromEntries(cert.subject.split('\n').map((x) => x.split('=')))
  const match = /^PNOEE-(\d{11})$/.exec(subject.serialNumber ?? '')

  if (!match) throw createError({ statusCode: 400, statusMessage: 'Could not extract identity from certificate' })

  return { idcode: match[1], givenName: subject.GN, surname: subject.SN }
}
