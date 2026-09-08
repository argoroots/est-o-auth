// Finishes an ID-card login: verifies the Web eID token and returns the client redirect with an authorization code
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const client = await validateRequest(body, 'id-card', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce'])

  // Nonce is single-use: consumed atomically on lookup, and must belong to this client
  const session = await getSessionData(`id-card:${body.nonce}`, true, SESSION_TTL.NONCE)

  if (!session || session.client_id !== client.id) throw authError('Unknown, used or expired nonce')

  // The Web eID extension signs the page origin; ours comes from config in production
  const cert = await verifyWebEidToken(body, body.nonce, getOrigin(event))
  const code = await saveUser(identityUser(getCertificateIdentity(cert), 'id-card'), session)

  return { url: codeRedirectUrl(session, code) }
})
