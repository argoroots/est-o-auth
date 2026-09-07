import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await checkRequest(body, null, ['client_id', 'client_secret', 'grant_type', 'code'])

  const client = await getClient(body)

  if (body.grant_type !== 'authorization_code') throw createError({ statusCode: 400, statusMessage: 'Parameter grant_type must be "authorization_code"' })

  const validSecret = await bcrypt.compare(body.client_secret, client.secret)

  if (!validSecret) throw createError({ statusCode: 403, statusMessage: 'Invalid client_secret' })

  const token = await getToken(body.code, client.id, body.redirect_uri, 3600)

  if (!token) throw createError({ statusCode: 403, statusMessage: 'Invalid code' })

  return {
    access_token: token,
    expires_in: 3600,
    // id_token: '',
    token_type: 'Bearer',
    scope: body.scope
  }
})
