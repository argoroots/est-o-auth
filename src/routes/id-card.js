const storage = require('../storage.js')

async function getCode (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
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

  const userInfo = Object.fromEntries(headers.ssl_client_s_dn.split(',').map(x => {
    const info = x.split('=')
    return [info[0], info[1]]
  }))

  const code = await storage.saveUser({
    idcode: userInfo.serialNumber,
    firstname: userInfo.GN,
    lastname: userInfo.SN
  })

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    code: code,
    state: params.state
  }))
}

module.exports = {
  getCode
}
