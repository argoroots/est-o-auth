const { randomBytes, X509Certificate } = require('crypto')
const storage = require('./_storage.js')

async function getNonce (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
    return
  }

  if (params.scope !== 'openid') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter scope must be "openid"' }))
    return
  }

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

  // if (!client.redirect_uris.includes(params.redirect_uri)) {
  //   res.writeHead(403, { 'Content-Type': 'application/json' })
  //   res.end(JSON.stringify({ error: 'Invalid redirect_uri' }))
  //   return
  // }

  const nonce = randomBytes(32).toString('base64')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ nonce }))
}

async function postCode (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
    return
  }

  if (params.scope !== 'openid') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter scope must be "openid"' }))
    return
  }

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

  if (!params.certificate) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter certificate is required' }))
    return
  }

  const client = await storage.getClient(params.client_id)

  if (!client) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_id' }))
    return
  }

  // if (!client.redirect_uris.includes(params.redirect_uri)) {
  //   res.writeHead(403, { 'Content-Type': 'application/json' })
  //   res.end(JSON.stringify({ error: 'Invalid redirect_uri' }))
  //   return
  // }

  const certBuffer = Buffer.from(params.certificate, 'base64')
  const cert = new X509Certificate(certBuffer)

  if (new Date() < new Date(cert.validFrom)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Certificate is not yet valid' }))
    return
  }

  if (new Date() > new Date(cert.validTo)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Certificate is expired' }))
    return
  }

  if (!cert.keyUsage.includes('1.3.6.1.5.5.7.3.2')) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Certificate is not for authentication' }))
    return
  }

  const userInfo = Object.fromEntries(cert.subject.split('\n').map(x => x.split('=')))
  const issuerInfo = Object.fromEntries(cert.issuer.split('\n').map(x => x.split('=')))

  const id = userInfo.serialNumber
  const name = `${userInfo.GN} ${userInfo.SN}`

  const code = await storage.saveUser({
    id,
    email: `${id}@eesti.ee`,
    name,
    provider: 'web-eid'
  })

  const query = { code }

  if (params.state) {
    query.state = params.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ redirect: `${params.redirect_uri}?${queryString}` }))

  await storage.setUsage(params.client_id, 'web-eid')
}

module.exports = {
  getNonce,
  postCode
}
