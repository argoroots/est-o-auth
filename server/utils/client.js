// Validates an OAuth request (required params, response_type, scope, known client with the provider) and returns the client
export async function validateRequest (data, provider, requiredParams = []) {
  const missing = requiredParams.find((name) => !data[name])

  if (missing) throw missingParamError(missing)
  if (requiredParams.includes('response_type') && data.response_type !== 'code') throw apiError(400, 'invalid.responseType')
  if (requiredParams.includes('scope') && data.scope !== 'openid') throw apiError(400, 'invalid.scope')

  if (!data.client_id) return

  const client = await getClientConfig(data.client_id)

  if (!client) throw apiError(403, 'client.invalid')
  if (provider && !client.providers?.includes(provider)) throw apiError(400, 'client.providerNotEnabled')

  // Not enforced yet: log what each client sends so registered URIs can be filled in first
  if (data.redirect_uri) {
    const hasRegistered = client.redirectUris?.length > 0
    const isRegistered = hasRegistered && client.redirectUris.some((r) => isRegisteredRedirect(r, data.redirect_uri))

    console.info(`[redirect] client ${client.id} redirect_uri ${logSafe(data.redirect_uri)} registered=${isRegistered}${hasRegistered ? '' : ' (none configured)'}`)

    // Once every active client's redirectUris is filled in from the logs, enforce with: if (hasRegistered && !isRegistered) throw apiError(400, 'client.redirectNotRegistered')
  }

  return client
}

// Exact string match as RFC 6749 §3.1.2.3 and RFC 9700 require; only a fragment is ignored
function isRegisteredRedirect (registered, requested) {
  const withoutFragment = (uri) => String(uri).split('#')[0]

  return withoutFragment(registered) === withoutFragment(requested)
}
