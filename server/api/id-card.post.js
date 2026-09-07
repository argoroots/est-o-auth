export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce'])

  const client = await getClient(body)

  await checkUsageLimit(client.id, 'id-card')

  // Nonce is single-use and short-lived: consumed atomically on lookup, and must belong to this client
  const nonceSession = await getSessionData(`id-card:${body.nonce}`, true, SESSION_TTL.NONCE)

  if (!nonceSession || nonceSession.client_id !== client.id) throw authError('Unknown, used or expired nonce')

  // The Web eID extension signs the page origin; ours comes from config in production
  const cert = await verifyWebEidToken(body, body.nonce, getOrigin(event))
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
