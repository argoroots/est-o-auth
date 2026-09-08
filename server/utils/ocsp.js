import * as pkijs from 'pkijs'

// pkijs needs a WebCrypto engine; Node exposes one on globalThis.crypto
pkijs.setEngine('node', new pkijs.CryptoEngine({ name: 'node', crypto: globalThis.crypto }))

const OCSP_TIMEOUT_MS = 5000
// 2 min age plus 15 min clock skew, matching the Web eID reference validator defaults
const OCSP_MAX_AGE_MS = 2 * 60 * 1000
const OCSP_CLOCK_SKEW_MS = 15 * 60 * 1000

const STATUS = { 0: 'good', 1: 'revoked', 2: 'unknown' }

// Node X509Certificate as a pkijs Certificate
function toPkijs (x509) {
  return pkijs.Certificate.fromBER(new Uint8Array(x509.raw).buffer)
}

// Checks revocation against the issuer's pinned OCSP responder; any doubt (unreachable, stale, unknown) fails closed
export async function checkRevocation (certX509, issuerX509, url) {
  const cert = toPkijs(certX509)
  const issuer = toPkijs(issuerX509)

  const request = new pkijs.OCSPRequest()
  await request.createForCertificate(cert, { hashAlgorithm: 'SHA-1', issuerCertificate: issuer })

  let raw

  try {
    raw = await $fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/ocsp-request' },
      body: Buffer.from(request.toSchema(true).toBER(false)),
      responseType: 'arrayBuffer',
      timeout: OCSP_TIMEOUT_MS
    })
  }
  catch (error) {
    console.warn(`[ocsp] ${url} unreachable: ${error.message}`)
    throw authError('Certificate status could not be verified')
  }

  const response = pkijs.OCSPResponse.fromBER(raw)

  if (response.responseStatus.valueBlock.valueDec !== 0 || !response.responseBytes) throw authError('OCSP responder returned an error')

  const basic = pkijs.BasicOCSPResponse.fromBER(response.responseBytes.response.valueBlock.valueHexView)

  // Response signature must chain to the certificate's issuer
  let signatureValid = false

  try {
    signatureValid = await basic.verify({ trustedCerts: [issuer] })
  }
  catch (error) {
    console.warn(`[ocsp] ${url} response rejected: ${error.message}`)
  }

  if (!signatureValid) throw authError('OCSP response signature is invalid')

  const { isForCertificate, status } = await basic.getCertificateStatus(cert, issuer)

  if (!isForCertificate) throw authError('OCSP response is for a different certificate')

  const single = basic.tbsResponseData.responses[0]
  const now = Date.now()
  const thisUpdate = new Date(single.thisUpdate).getTime()
  const nextUpdate = single.nextUpdate ? new Date(single.nextUpdate).getTime() : null

  const tooOld = now - thisUpdate > OCSP_MAX_AGE_MS + OCSP_CLOCK_SKEW_MS
  const fromFuture = thisUpdate - now > OCSP_CLOCK_SKEW_MS
  const expired = nextUpdate && now - nextUpdate > OCSP_CLOCK_SKEW_MS

  if (tooOld || fromFuture || expired) throw authError('OCSP response is stale')

  if (status !== 0) {
    console.warn(`[ocsp] certificate ${certX509.serialNumber} status ${STATUS[status] ?? status}`)
    throw authError(status === 1 ? 'Certificate is revoked' : 'Certificate status is unknown')
  }
}
