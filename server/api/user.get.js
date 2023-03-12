import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const headers = getHeaders(event)
  const query = getQuery(event)

  if (!headers.authorization && !query.access_token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const token = query.access_token || headers.authorization.replace('Bearer ', '')

  try {
    const decodedToken = jwt.verify(token, config.jwtSecret)

    return {
      id: decodedToken.id,
      email: decodedToken.email,
      name: decodedToken.name,
      provider: decodedToken.provider
    }
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
