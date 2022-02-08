const storage = require('../storage.js')

async function getToken (headers, params, res) {
  if (params.grant_type !== 'authorization_code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter grant_type must be "authorization_code"' }))
    return
  }

  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter code is required' }))
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
    scope: params.scope
  }))
}

module.exports = {
  getToken
}