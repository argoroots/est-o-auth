import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const headers = getHeaders(event)
  const query = getQuery(event)

  if (!headers.authorization && !query.access_token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Header is the documented preference; the query parameter is kept for existing integrations
  const token = headers.authorization?.replace(/^Bearer\s+/i, '') || query.access_token

  try {
    const decodedToken = jwt.verify(token, config.jwtSecret)

    return {
      id: decodedToken.id,
      email: decodedToken.email,
      name: decodedToken.name,
      provider: decodedToken.provider
    }
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
