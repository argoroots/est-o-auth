const storage = require('./_storage.js')

async function getCode (headers, params, res) {
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

  if (headers.ssl_client_verify !== 'SUCCESS' || !headers.ssl_client_s_dn) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'ID-Card error' }))
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

  const userInfo = Object.fromEntries(headers.ssl_client_s_dn.split(',').map(x => {
    const info = x.split('=')
    return [info[0], info[1]]
  }))

  const id = userInfo.serialNumber.replace('PNOEE-', '')
  const name = `${userInfo.GN} ${userInfo.SN}`

  const code = await storage.saveUser({
    id,
    email: `${id}@eesti.ee`,
    name,
    provider: 'id-card'
  })

  const query = { code }

  if (params.state) {
    query.state = params.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(302, { Location: `${params.redirect_uri}?${queryString}` })
  res.end()
}

module.exports = {
  getCode
}
