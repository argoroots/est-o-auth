import jwt from 'jsonwebtoken'

// User info endpoint. The access token is accepted only as a Bearer authorization header, never in
// the query string, so it does not end up in server, proxy or browser history logs.
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const match = /^Bearer\s+(\S+)$/i.exec(getHeader(event, 'authorization') ?? '')

  setResponseHeaders(event, { 'Cache-Control': 'no-store', Pragma: 'no-cache' })

  if (!match) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  try {
    // Pin the algorithm so a token signed any other way is rejected regardless of its header
    const decodedToken = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'] })

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
