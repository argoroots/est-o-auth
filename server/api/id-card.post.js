import { X509Certificate } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  checkRequest(body, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = getClient(body)

  const certBuffer = Buffer.from(body.unverifiedCertificate, 'base64')
  const cert = new X509Certificate(certBuffer)
  const userInfo = Object.fromEntries(cert.subject.split('\n').map(x => x.split('=')))
  // const issuerInfo = Object.fromEntries(cert.issuer.split('\n').map(x => x.split('=')))

  if (new Date() < new Date(cert.validFrom)) throw createError({ statusCode: 400, statusMessage: 'Certificate is not yet valid' })
  if (new Date() > new Date(cert.validTo)) throw createError({ statusCode: 400, statusMessage: 'Certificate is expired' })
  if (!cert.keyUsage.includes('1.3.6.1.5.5.7.3.2')) throw createError({ statusCode: 400, statusMessage: 'Certificate is not for authentication' })

  const idcode = userInfo.serialNumber.replace('PNOEE-', '')
  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    name: `${userInfo.GN} ${userInfo.SN}`,
    provider: 'id-card'
  })

  const search = new URLSearchParams({ code, state: body.state }).toString()

  await setUsage(client.id, 'id-card')

  return { url: `${body.redirect_uri}?${search}` }
})
