import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  checkRequest(body, null, ['client_id', 'client_secret', 'grant_type', 'code'])

  const client = await getClient(event)

  if (body?.grant_type !== 'authorization_code') throw createError({ statusCode: 400, statusMessage: 'Parameter grant_type must be "authorization_code"' })
  if (!body?.client_id) throw createError({ statusCode: 400, statusMessage: 'Parameter client_id is required' })
  if (!body?.client_secret) throw createError({ statusCode: 400, statusMessage: 'Parameter client_secret is required' })
  if (!body?.code) throw createError({ statusCode: 400, statusMessage: 'Parameter code is required' })

  const validSecret = await bcrypt.compare(body.client_secret, client.secret)

  if (!validSecret) throw createError({ statusCode: 403, statusMessage: 'Invalid client_secret' })

  const token = await getToken(body.code, 3600)

  if (!token) throw createError({ statusCode: 403, statusMessage: 'Invalid code' })

  return {
    access_token: token,
    expires_in: 3600,
    // id_token: '',
    token_type: 'Bearer',
    scope: body.scope
  }
})
