export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce'])

  const client = await getClient(body)

  await checkUsageLimit(client.id, 'id-card')

  // Nonce is single-use: consumed on lookup
  const nonceSession = await getSessionData(`id-card:${body.nonce}`, true)

  if (!nonceSession) throw createError({ statusCode: 400, statusMessage: 'Unknown or already used nonce' })
  if (Date.now() - nonceSession.issued > WEB_EID_NONCE_TTL_MS) throw createError({ statusCode: 400, statusMessage: 'Nonce has expired' })

  // Origin the browser saw, which is what the Web eID extension signed
  const origin = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin

  const cert = await verifyWebEidToken(body, body.nonce, origin)
  const { idcode, givenName, surname } = getCertificateIdentity(cert)

  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    name: `${givenName} ${surname}`,
    provider: 'id-card'
  })

  const search = new URLSearchParams({ code, state: body.state }).toString()

  await setBillingUsage(client.stripeId, 'id-card')
  await setUsage(client.id, 'id-card')

  return { url: `${body.redirect_uri}?${search}` }
})
