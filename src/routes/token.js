const storage = require('../storage.js')

async function getToken (headers, params, res) {
  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Code is required' }))
    return
  }

  const token = await storage.getToken(params.code, 3600)

  if (!token) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid code' }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    access_token: token,
    expires_in: 3600,
    // id_token: '',
    token_type: 'Bearer',
    scope: headers.scope
  }))
}

module.exports = {
  getToken
}
