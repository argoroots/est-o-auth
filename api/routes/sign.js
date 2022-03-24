const crypto = require('crypto')

async function getSign (headers, params, res) {
  const content = {}

  if (!params.sessionId) {
    content.sessionId = crypto.randomUUID().replaceAll('-', '')
    content.code = '0000'
  } else if (Math.round(Math.random()) === 1) {
    content.sessionId = params.sessionId
    content.code = '0000'
  } else {
    content.key = crypto.randomUUID().replaceAll('-', '')
  }

  res.writeHead(200, {
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'
  })
  res.end(JSON.stringify(content))
}

module.exports = {
  getSign
}
