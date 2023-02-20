const bcrypt = require('bcrypt')
const storage = require('./_storage.js')

async function getToken (headers, params, res) {
  if (!params.client_id) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter client_id is required' }))
    return
  }

  if (!params.client_secret) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter client_secret is required' }))
    return
  }

  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter code is required' }))
    return
  }

  if (params.grant_type !== 'authorization_code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter grant_type must be "authorization_code"' }))
    return
  }

  const client = await storage.getClient(params.client_id)

  if (!client) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_id' }))
    return
  }

  if (!bcrypt.compare(params.client_secret, client.secret)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_secret' }))
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
