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
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({}))
    return
  }

  const usage = await storage.getUsage(params.client_id)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    client: client.id,
    description: client.description,
    redirect_uri: client.redirect_uris.includes(params.redirect_uri),
    providers: client.providers,
    usage
  }))
}

module.exports = {
  getClient
}
