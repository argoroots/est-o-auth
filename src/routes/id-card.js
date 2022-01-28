const storage = require('../storage.js')

async function getCode (headers, params, res) {
  console.log(headers)
  console.log(params)

  const user = {
    idc: null,
    email: null
  }
  const code = await storage.saveUser(user)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    code: code
  }))
}

module.exports = {
  getCode
}
