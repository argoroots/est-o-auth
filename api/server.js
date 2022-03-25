const http = require('http')
const idCard = require('./routes/id-card.js')
const token = require('./routes/token.js')
const user = require('./routes/user.js')
const sign = require('./routes/sign.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  try {
    const { method, socket } = req
    const headers = getHeaders(req)
    const params = await getParams(req)
    const { pathname } = new URL(req.url, `${req.protocol}://${headers.host}/`)

    console.log(method, pathname)

    if (method === 'GET' && pathname === '/auth/id-card') {
      idCard.getCode(headers, params, res)
    } else if (method === 'POST' && pathname === '/token') {
      token.getToken(headers, params, res)
    } else if (method === 'GET' && pathname === '/user') {
      user.getUser(headers, params, res)
    } else if (method === 'POST' && pathname === '/sign') {
      sign.getSign(headers, params, res)
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
  return new Promise((resolve, reject) => {
    const { method } = req
    const headers = getHeaders(req)

    if (method === 'GET') {
      const { searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
      resolve(Object.fromEntries(searchParams))
    }

    if (method === 'POST') {
      let body = ''

      req.on('data', chunk => {
        body += chunk.toString()
      })

      req.on('end', () => {
        try {
          if (headers['content-type'] === 'application/x-www-form-urlencoded') {
            const { searchParams } = new URL(`/?${body}`, `${req.protocol}://${headers.host}/`)
            resolve(Object.fromEntries(searchParams))
          } else {
            resolve(JSON.parse(body))
          }
        } catch (error) {
          reject(new Error('Invalid request body'))
        }
      })
    }
  })
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
