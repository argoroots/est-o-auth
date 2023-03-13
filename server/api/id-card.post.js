import { createVerify, verify, X509Certificate } from 'crypto'

export default defineEventHandler(async (event) => {
  await checkRequest(event, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(event)
  const body = await readBody(event)

  const certBuffer = Buffer.from(body.unverifiedCertificate, 'base64')
  const cert = new X509Certificate(certBuffer)
  const verifier = createVerify(body.algorithm)
  const userInfo = Object.fromEntries(cert.subject.split('\n').map(x => x.split('=')))
  // const issuerInfo = Object.fromEntries(cert.issuer.split('\n').map(x => x.split('=')))

  verifier.update(body.unverifiedCertificate)

  if (!verify(cert.publicKey, body.signature)) throw createError({ statusCode: 400, statusMessage: 'Invalid certificate' })
  if (new Date() < new Date(cert.validFrom)) throw createError({ statusCode: 400, statusMessage: 'Certificate is not yet valid' })
  if (new Date() > new Date(cert.validTo)) throw createError({ statusCode: 400, statusMessage: 'Certificate is expired' })
  if (!cert.keyUsage.includes('1.3.6.1.5.5.7.3.2')) throw createError({ statusCode: 400, statusMessage: 'Certificate is not for authentication' })

  const code = await saveUser({
    id: userInfo.serialNumber,
    email: `${userInfo.serialNumber}@eesti.ee`,
    name: `${userInfo.GN} ${userInfo.SN}`,
    provider: 'id-card'
  })

  const search = new URLSearchParams({ code, state: body.state }).toString()

  await setUsage(client.id, 'id-card')

  return { url: `${body.redirect_uri}?${search}` }
})