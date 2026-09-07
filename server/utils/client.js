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

  return client
}
