const http = require('http')
const error = require('./routes/error.js')
const email = require('./routes/email.js')
const mobileId = require('./routes/mobileId.js')
const idCard = require('./routes/idCard.js')
const token = require('./routes/token.js')
const user = require('./routes/user.js')

const port = process.env.PORT || 8080

const server = http.createServer(async (req, res) => {
  try {
    const headers = getHeaders(req)
    const params = getParams(req)

    const { method } = req
    const { pathname } = new URL(req.url, `${req.protocol}://${headers.host}/`)

    switch (`${method.toUpperCase()} ${pathname.toLowerCase()}`) {
      case 'POST /api/e-mail':
        await email.postEmail(headers, params, res)
        break
      case 'POST /api/e-mail/code':
        await email.postCode(headers, params, res)
        break
      case 'POST /api/mobile-id':
        await mobileId.postSession(headers, params, res)
        break
      case 'POST /api/mobile-id/code':
        await mobileId.postCode(headers, params, res)
        break
      case 'GET /api/id-card':
        await idCard.getCode(headers, params, res)
        break
      case 'POST /token':
        await token.getToken(headers, params, res)
        break
      case 'GET /user':
        await user.getUser(headers, params, res)
        break
      default:
        await error.get404(method, pathname, params, res)
        break
    }
  } catch (e) {
    console.error(e)
    await error.get500(res)
  }
})

function getHeaders (req) {
  return Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v])
  )
}

function getParams (req) {
  const { method } = req
  const headers = getHeaders(req)

  const { searchParams } = new URL(req.url, `${req.protocol}://${headers.host}/`)
  const urlParams = Object.fromEntries(searchParams)

  if (method === 'GET') {
    return urlParams
  }

  if (method === 'POST') {
    let body = ''

    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        if (!body) {
          return urlParams
        } else if (headers['content-type'] === 'application/x-www-form-urlencoded') {
          const { searchParams } = new URL(`/?${body}`, `${req.protocol}://${headers.host}/`)
          return { ...urlParams, ...Object.fromEntries(searchParams) }
        } else {
          return { ...urlParams, ...JSON.parse(body) }
        }
      } catch (e) {
        console.error(e)
        throw new Error('Invalid request body')
      }
    })
  }
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
