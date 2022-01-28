const http = require('http')
const idCard = require('./routes/id-card.js')
const token = require('./routes/token.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  try {
    const { method, socket } = req
    const params = getParams(req)
    const headers = getHeaders(req)
    const { pathname } = new URL(req.url, `${req.protocol}://${headers.host}/`)

    if (method === 'GET' && pathname === '/auth/id-card') {
      idCard.getCode(headers, params, res)
    } else if (method === 'POST' && pathname === '/token') {
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

function getHeaders (req) {
  return Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v])
  )
}

function getParams (req) {
  const { method, body } = req
  const headers = getHeaders(req)

  console.log(headers)

  if (method === 'GET') {
    console.log('get')
    console.log(req.url)

    const { searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
    return Object.fromEntries(searchParams)
  }

  if (method === 'POST' && headers['content-type'] === 'application/x-www-form-urlencoded') {
    console.log('urlencoded')
    console.log(body)

    const { searchParams } = new URL(body, `${req.protocol}://${headers.host}/`)
    return Object.fromEntries(searchParams)
  }

  if (method === 'POST' && headers['content-type'] === 'application/json') {
    console.log('json')
    console.log(body)

    return JSON.parse(body)
  }

  return {}
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
