const crypto = require('crypto')

async function getSign (headers, params, res) {
  const content = {}

  if (Math.round(Math.random()) === 1) {
    content.key = crypto.randomUUID().replaceAll('-', '')
  } else {
    content.sessionId = crypto.randomUUID().replaceAll('-', '')
    content.code = '0000'
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(content))
}

module.exports = {
  getSign
}
