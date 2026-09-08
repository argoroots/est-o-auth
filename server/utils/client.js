// Validates an OAuth request (required params, response_type, scope, known client with the provider) and returns the client
export async function validateRequest (data, provider, requiredParams = []) {
  const missing = requiredParams.find((name) => !data[name])

  if (missing) throw createError({ statusCode: 400, statusMessage: `Required parameter "${missing}" is missing` })
  if (requiredParams.includes('response_type') && data.response_type !== 'code') throw createError({ statusCode: 400, statusMessage: 'The response_type must be "code"' })
  if (requiredParams.includes('scope') && data.scope !== 'openid') throw createError({ statusCode: 400, statusMessage: 'The scope must be "openid"' })

  if (!data.client_id) return

  const client = await getClientConfig(data.client_id)

  if (!client) throw createError({ statusCode: 403, statusMessage: 'Invalid client_id' })
  if (provider && !client.providers?.includes(provider)) throw createError({ statusCode: 400, statusMessage: 'The authentication provider is not enabled for this client' })

  // Not enforced yet: log what each client sends so registered URIs can be filled in first
  if (data.redirect_uri) {
    const hasRegistered = client.redirectUris?.length > 0
    const isRegistered = hasRegistered && client.redirectUris.some((r) => isRegisteredRedirect(r, data.redirect_uri))

    console.info(`[redirect] client ${client.id} redirect_uri ${logSafe(data.redirect_uri)} registered=${isRegistered}${hasRegistered ? '' : ' (none configured)'}`)

    // Once every active client's redirectUris is filled in from the logs, enforce with: if (hasRegistered && !isRegistered) throw createError({ statusCode: 400, statusMessage: 'The redirect_uri does not match a registered redirect URI' })
  }

  return client
}

// Exact string match as RFC 6749 §3.1.2.3 and RFC 9700 require; only a fragment is ignored
function isRegisteredRedirect (registered, requested) {
  const withoutFragment = (uri) => String(uri).split('#')[0]

  return withoutFragment(registered) === withoutFragment(requested)
}
