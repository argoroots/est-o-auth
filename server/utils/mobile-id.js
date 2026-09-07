import { X509Certificate, verify, constants } from 'crypto'

// Verifies a Mobile-ID authentication result per https://github.com/SK-EID/MID#verifying-the-authentication-response:
// the returned signature must be over the hash we submitted, made with the returned certificate, and that
// certificate must be valid and chain to a trusted Mobile-ID CA. Returns the identity from the certificate.
//
// We submitted hash = SHA-<bits>(message) and kept the message, so the signature can be checked as a normal
// message signature. Mobile-ID SIMs produce ECDSA signatures as raw R||S (IEEE P1363) or RSA PKCS#1 v1.5.
export async function verifyMobileIdResponse (skResponse, midSession) {
  const { signature, cert } = skResponse

  if (!signature?.value || !signature?.algorithm || !cert) {
    throw createError({ statusCode: 400, statusMessage: 'Incomplete Mobile-ID response' })
  }

  const match = /^SHA(256|384|512)With(EC|RSA)Encryption$/i.exec(signature.algorithm)

  if (!match) throw createError({ statusCode: 400, statusMessage: 'Unsupported Mobile-ID signature algorithm' })

  const [, bits, family] = match

  if (bits !== midSession.hashBits) {
    throw createError({ statusCode: 400, statusMessage: 'Mobile-ID signature hash does not match the request' })
  }

  const x509 = new X509Certificate(Buffer.from(cert, 'base64'))

  await checkTrustedCertificate(x509, 'mobile-id')

  const message = Buffer.from(midSession.message, 'base64')
  const sig = Buffer.from(signature.value, 'base64')
  const keyOptions = family.toUpperCase() === 'EC'
    ? { key: x509.publicKey, dsaEncoding: 'ieee-p1363' }
    : { key: x509.publicKey, padding: constants.RSA_PKCS1_PADDING }

  let isValid

  try {
    isValid = verify(`sha${bits}`, message, keyOptions, sig)
  }
  catch {
    isValid = false
  }

  if (!isValid) throw createError({ statusCode: 400, statusMessage: 'Mobile-ID signature verification failed' })

  return getCertificateIdentity(x509)
}
