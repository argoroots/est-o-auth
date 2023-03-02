const https = require('https')
const jwt = require('jsonwebtoken')
const storage = require('./_storage.js')

async function getApple (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
    return
  }

  if (params.scope !== 'openid') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter scope must be "openid"' }))
    return
  }

  if (!params.client_id) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter client_id is required' }))
    return
  }

  if (!params.redirect_uri) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter redirect_uri is required' }))
    return
  }

  const client = await storage.getClient(params.client_id)

  if (!client) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_id' }))
    return
  }

  // if (!client.redirect_uris.includes(params.redirect_uri)) {
  //   res.writeHead(403, { 'Content-Type': 'application/json' })
  //   res.end(JSON.stringify({ error: 'Invalid redirect_uri' }))
  //   return
  // }

  const url = new URL('https://appleid.apple.com')

  url.pathname = '/auth/authorize'
  url.search = new URLSearchParams({
    client_id: process.env.APPLE_ID,
    redirect_uri: `https://${process.env.DOMAIN}/api/apple`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'email name',
    state: jwt.sign({ uri: params.redirect_uri, state: params.state }, process.env.JWT_SECRET, { expiresIn: '5m' })
  }).toString()

  res.writeHead(302, { Location: url })
  res.end()
}

async function postApple (headers, params, res) {
  if (!params.state) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter state is required' }))
    return
  }

  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter code is required' }))
    return
  }

  if (params.error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: params.error }))
    return
  }

  const decodedState = jwt.verify(params.state, process.env.JWT_SECRET)

  const accessToken = await getToken(params.code)

  const profile = jwt.decode(accessToken)

  console.log(profile)

  const code = '123'
  // const code = await storage.saveUser({
  //   id: profile.id,
  //   email: profile.emails?.[0]?.value,
  //   name: profile.displayName,
  //   provider: 'apple'
  // })

  const query = { code }

  if (decodedState.state) {
    query.state = decodedState.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(302, { Location: `${decodedState.uri}?${queryString}` })
  res.end()
}

const getToken = async (code) => {
  return new Promise((resolve, reject) => {
    const clientSecret = jwt.sign({}, process.env.APPLE_SECRET, {
      issuer: process.env.APPLE_TEAM,
      audience: 'https://appleid.apple.com',
      subject: process.env.APPLE_ID,
      expiresIn: '5m',
      algorithm: 'ES256'
    })

    const query = new URLSearchParams({
      client_id: process.env.APPLE_ID,
      client_secret: clientSecret,
      code,
      redirect_uri: `https://${process.env.DOMAIN}/api/apple`,
      grant_type: 'authorization_code'
    }).toString()

    const options = {
      host: 'appleid.apple.com',
      port: 443,
      method: 'POST',
      path: '/auth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': query.length
      }
    }

    https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        data = JSON.parse(data)

        if (res.statusCode === 200 && data.access_token && data.id_token) {
          resolve(data.id_token)
        } else {
          reject(data.error?.data)
        }
      })
    }).on('error', (err) => {
      reject(err)
    }).write(query)
  })
}

module.exports = {
  getApple,
  postApple
}
