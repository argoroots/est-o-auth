export async function checkRequest (data, provider, params = []) {
  if (params.some((x) => !data[x])) throw createError({ statusCode: 400, statusMessage: 'Required parameter is missing!' })
  if (params.includes('response_type') && data.response_type !== 'code') throw createError({ statusCode: 400, statusMessage: 'The response type do not match required value "code"!' })
  if (params.includes('scope') && data.scope !== 'openid') throw createError({ statusCode: 400, statusMessage: 'The scope do not match required value "openid"!' })

  if (!data.client_id) return

  const client = await getClientConfig(data.client_id)

  if (provider && !client.providers.includes(provider)) throw createError({ statusCode: 400, statusMessage: 'The authentication provider do not match a registered authentication provider!' })
  // if (!redirectUri) throw createError({ statusCode: 400, statusMessage: 'The redirect URI (redirect_uri) do not match a registered redirect URI!' })
}

export async function getClient ({ client_id: clientId }) {
  if (!clientId) throw createError({ statusCode: 403, statusMessage: 'Required parameter client_id is missing!' })

  const client = await getClientConfig(clientId)

  if (!client) throw createError({ statusCode: 403, statusMessage: 'Invalid client_id' })

  return client
}
