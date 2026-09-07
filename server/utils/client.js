// Validates an OAuth request and returns the client it belongs to.
// - every name in requiredParams must be present
// - response_type must be "code" and scope "openid" when they are required
// - the client must exist and, when a provider is given, have it enabled
// Returns undefined only when client_id is not among the required parameters and was not sent.
export async function validateRequest (data, provider, requiredParams = []) {
  const missing = requiredParams.find((name) => !data[name])

  if (missing) throw createError({ statusCode: 400, statusMessage: `Required parameter "${missing}" is missing!` })
  if (requiredParams.includes('response_type') && data.response_type !== 'code') throw createError({ statusCode: 400, statusMessage: 'The response type do not match required value "code"!' })
  if (requiredParams.includes('scope') && data.scope !== 'openid') throw createError({ statusCode: 400, statusMessage: 'The scope do not match required value "openid"!' })

  if (!data.client_id) return

  const client = await getClientConfig(data.client_id)

  if (!client) throw createError({ statusCode: 403, statusMessage: 'Invalid client_id' })
  if (provider && !client.providers?.includes(provider)) throw createError({ statusCode: 400, statusMessage: 'The authentication provider do not match a registered authentication provider!' })

  // Not enforced yet: log what each client sends so registered URIs can be filled in first.
  if (data.redirect_uri) {
    const hasRegistered = client.redirectUris?.length > 0
    const isRegistered = hasRegistered && client.redirectUris.some((r) => isRegisteredRedirect(r, data.redirect_uri))

    console.info(`[redirect] client ${client.id} redirect_uri ${data.redirect_uri} registered=${isRegistered}${hasRegistered ? '' : ' (none configured)'}`)

    // Enforcement, once every active client's redirectUris is filled in from the logs:
    // if (hasRegistered && !isRegistered) throw createError({ statusCode: 400, statusMessage: 'The redirect URI (redirect_uri) do not match a registered redirect URI!' })
  }

  return client
}

// Simple string comparison as RFC 6749 §3.1.2.3 and RFC 9700 require: the whole URI must equal the
// registered one. Only a fragment is disregarded, since it never reaches a server and the RFC forbids
// it in a redirect URI. Per-login data belongs in `state`, not in the redirect URI.
function isRegisteredRedirect (registered, requested) {
  const withoutFragment = (uri) => String(uri).split('#')[0]

  return withoutFragment(registered) === withoutFragment(requested)
}
