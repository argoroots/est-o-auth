const jwt = require('jsonwebtoken')

async function getUser (headers, params, res) {
  if (!headers.authorization && !params.access_token) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  const token = params.access_token || headers.authorization.replace('Bearer ', '')

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      id: decodedToken.id,
      email: decodedToken.email,
      name: decodedToken.name,
      provider: decodedToken.provider
    }))
  } catch (e) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid token' }))
  }
}

module.exports = {
  getUser
}
