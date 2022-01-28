const http = require('http')
const idCard = require('./routes/id-card.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  const { method, headers, socket } = req
  const { pathname, searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
  const params = Object.fromEntries(searchParams)

  if (method === 'GET' && pathname === '/auth/id-card') {
    idCard.getCode(headers, params, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      clientIp: headers['x-forwarded-for'] || socket.remoteAddress,
      method: method,
      path: pathname,
      params: params
    }))
  }
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
