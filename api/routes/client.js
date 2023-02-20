const storage = require('./_storage.js')

async function getClient (headers, params, res) {
  if (!params.client_id) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter client_id is required' }))
    return
  }

  if (!params.redirect_uri) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter redirect_uri is required' }))
    return
  }

  const client = await storage.getClient(params.client_id)

  if (!client) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_id' }))
    return
  }

  if (!client.redirect_uris.includes(params.redirect_uri)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid redirect_uri' }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    client: client.id,
    providers: client.providers
  }))
}

module.exports = {
  getClient
}
