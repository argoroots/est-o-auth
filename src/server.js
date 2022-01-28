const http = require('http')
const idCard = require('./routes/id-card.js')
const token = require('./routes/token.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  try {
    const { method, headers, socket } = req
    const { pathname, searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
    const params = Object.fromEntries(searchParams)

    if (method === 'GET' && pathname === '/auth/id-card') {
      idCard.getCode(headers, params, res)
    } else if (method === 'GET' && pathname === '/token') {
      token.getToken(headers, params, res)
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        clientIp: headers['x-forwarded-for'] || socket.remoteAddress,
        method: method,
        path: pathname,
        params: params
      }))
    }
  } catch (error) {
    console.error(error)

    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: true
    }))
  }
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
