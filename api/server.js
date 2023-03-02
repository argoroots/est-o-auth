const http = require('http')
const error = require('./routes/error.js')
const client = require('./routes/client.js')
const mobileId = require('./routes/mobileId.js')
const smartId = require('./routes/smartId.js')
const idCard = require('./routes/idCard.js')
const apple = require('./routes/apple.js')
const google = require('./routes/google.js')
const email = require('./routes/email.js')
const phone = require('./routes/phone.js')
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
      case 'GET /api/client':
        await client.getClient(headers, params, res)
        break
      case 'POST /api/mobile-id':
        await mobileId.postSession(headers, params, res)
        break
      case 'POST /api/mobile-id/code':
        await mobileId.postCode(headers, params, res)
        break
      case 'POST /api/smart-id':
        await smartId.postSession(headers, params, res)
        break
      case 'POST /api/smart-id/code':
        await smartId.postCode(headers, params, res)
        break
      case 'GET /api/id-card':
        await idCard.getCode(headers, params, res)
        break
      case 'GET /api/apple':
        await apple.getApple(headers, params, res)
        break
      case 'POST /api/apple':
        await apple.postApple(headers, params, res)
        break
      case 'GET /api/google':
        await google.getGoogle(headers, params, res)
        break
      case 'POST /api/google':
        await google.postGoogle(headers, params, res)
        break
      case 'POST /api/e-mail':
        await email.postEmail(headers, params, res)
        break
      case 'POST /api/e-mail/code':
        await email.postCode(headers, params, res)
        break
      case 'POST /api/phone':
        await phone.postPhone(headers, params, res)
        break
      case 'POST /api/phone/code':
        await phone.postCode(headers, params, res)
        break
      case 'POST /token':
        await token.getToken(headers, params, res)
        break
      case 'GET /user':
        await user.getUser(headers, params, res)
        break
      default:
        error.get404(method, pathname, params, res)
        break
    }
  } catch (e) {
    console.error(e)
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
        } catch (e) {
          console.error(e)
          reject(new Error('Invalid request body'))
        }
      })
    }
  })
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
