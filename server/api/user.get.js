import jwt from 'jsonwebtoken'

// User info for a Bearer access token; the token is never accepted in the URL, so it never lands in logs
export default defineEventHandler((event) => {
  const match = /^Bearer\s+(\S+)$/i.exec(getHeader(event, 'authorization') ?? '')

  setResponseHeaders(event, { 'Cache-Control': 'no-store', Pragma: 'no-cache' })

  if (!match) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  try {
    const { id, email, phone, name, provider } = jwt.verify(match[1], useRuntimeConfig().jwtSecret, { algorithms: ['HS256'] })

    return { id, email, phone, name, provider }
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
