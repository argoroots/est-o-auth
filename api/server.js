const http = require('http')
const error = require('./routes/error.js')
const idCard = require('./routes/id-card.js')
const token = require('./routes/token.js')
const user = require('./routes/user.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  try {
    const headers = getHeaders(req)
    const params = await getParams(req)
    const { method } = req
    const { pathname } = new URL(req.url, `${req.protocol}://${headers.host}/`)

    switch (`${method.toUpperCase()} ${pathname.toLowerCase()}`) {
      case 'GET /auth/id-card':
        idCard.getCode(headers, params, res)
        break
      case 'POST /token':
        token.getToken(headers, params, res)
        break
      case 'GET /user':
        user.getUser(headers, params, res)
        break
      default:
        error.get404(method, pathname, params, res)
        break
    }
  } catch (error) {
    console.error(error)
    error.get500(res)
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

    const { searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
    const urlParams = Object.fromEntries(searchParams)

    if (method === 'GET') {
      resolve(urlParams)
      return
    }

    if (method === 'POST') {
      let body = ''

      req.on('data', chunk => {
        body += chunk.toString()
      })

      req.on('end', () => {
        try {
          if (!body) {
            resolve(urlParams)
          } else if (headers['content-type'] === 'application/x-www-form-urlencoded') {
            const { searchParams } = new URL(`/?${body}`, `${req.protocol}://${headers.host}/`)
            resolve({ ...urlParams, ...Object.fromEntries(searchParams) })
          } else {
            resolve({ ...urlParams, ...JSON.parse(body) })
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
