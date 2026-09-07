export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce'])

  const client = await getClient(body)

  await checkUsageLimit(client.id, 'id-card')

  // Nonce is single-use and short-lived: consumed atomically on lookup, and must belong to this client
  const nonceSession = await getSessionData(`id-card:${body.nonce}`, true, SESSION_TTL.NONCE)

  if (!nonceSession || nonceSession.client_id !== client.id) throw authError('Unknown, used or expired nonce')

  // Origin the browser saw, which is what the Web eID extension signed
  const origin = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin

  const cert = await verifyWebEidToken(body, body.nonce, origin)
  const { idcode, givenName, surname } = getCertificateIdentity(cert)

  const code = await saveUser({
    id: idcode,
    email: `${idcode}@eesti.ee`,
    name: `${givenName} ${surname}`,
    provider: 'id-card'
  }, nonceSession)

  const search = new URLSearchParams({ code, state: nonceSession.state }).toString()

  await setBillingUsage(client.stripeId, 'id-card')
  await setUsage(client.id, 'id-card')

  return { url: `${nonceSession.redirect_uri}?${search}` }
})
