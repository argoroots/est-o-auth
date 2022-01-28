const storage = require('../storage.js')

async function getCode (headers, params, res) {
  if (headers.ssl_client_verify !== 'SUCCESS') {
    throw new Error('ID-Card reading error')
  }

  if (!headers.ssl_client_s_dn) {
    throw new Error('ID-Card reading error')
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
    code: code
  }))
}

module.exports = {
  getCode
}
