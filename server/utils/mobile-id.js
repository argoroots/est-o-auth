import { X509Certificate, constants } from 'crypto'

// Mobile-ID authentication response verification, per https://github.com/SK-EID/MID#authentication
// We submitted hash = SHA-256(message) and kept the message, so the returned signature can be checked
// as an ordinary message signature. SIMs produce ECDSA as raw R||S or RSA PKCS#1 v1.5.
export async function verifyMobileIdResponse (skResponse, midSession) {
  const { signature, cert } = skResponse
  const match = /^SHA256With(EC|RSA)Encryption$/i.exec(signature?.algorithm ?? '')

  if (!match || !signature.value || !cert) throw authError('Unexpected Mobile-ID response')

  const x509 = new X509Certificate(Buffer.from(cert, 'base64'))

  await checkTrustedCertificate(x509, 'mobile-id')

  const keyOptions = match[1].toUpperCase() === 'EC'
    ? { key: x509.publicKey, dsaEncoding: 'ieee-p1363' }
    : { key: x509.publicKey, padding: constants.RSA_PKCS1_PADDING }

  if (!safeVerify('sha256', Buffer.from(midSession.message, 'base64'), keyOptions, Buffer.from(signature.value, 'base64'))) {
    throw authError('Signature verification failed')
  }

  return getCertificateIdentity(x509)
}
