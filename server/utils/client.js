import { readFile } from 'fs/promises'
import yaml from 'yaml'

const file = await readFile('.clients.yaml', 'utf8')
const clients = yaml.parse(file)

export async function checkRequest (event) {
  if (query.response_type !== 'code') {
    throw createError({ statusCode: 400, statusMessage: 'The response type (response_type) in the request do not match required value "code"!' })
  }

  if (query.scope !== 'openid') {
    throw createError({ statusCode: 400, statusMessage: 'The scope in the request do not match required value "openid"!' })
  }

  if (!query.client_id || !query.redirect_uri || !query.state) {
    throw createError({ statusCode: 400, statusMessage: 'Required parameter (response_type, client_id, redirect_uri, scope or state) is missing!' })
  }

  const client = await getClient(event)

  if (!client) {
    throw createError({ statusCode: 400, statusMessage: 'The client ID (client_id) in the request do not match a registered client ID!' })
  }

  // if (!redirectUri) {
  //   throw createError({ statusCode: 400, statusMessage: 'The redirect URI (redirect_uri) in the request do not match a registered redirect URI!' })
  // }

  if (!path.startsWith('/api/client') && !client.providers.some(x => path === `/api/${x}`)) {
    throw createError({ statusCode: 400, statusMessage: 'The authentication provider in the request do not match a registered authentication provider!' })
  }

  event.context.auth = client
}

export async function getClient (event) {
  const { client_id: clientId } = isMethod(event, 'GET') ? getQuery(event) : await readBody(event)

  if (!clientId) throw createError({ statusCode: 403, statusMessage: 'Required parameter client_id is missing!' })

  const client = clients?.find(client => client.id === clientId)

  if (!client) throw createError({ statusCode: 403, statusMessage: 'Invalid client_id' })

  return client
}
