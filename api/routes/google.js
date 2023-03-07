const https = require('https')
const jwt = require('jsonwebtoken')
const storage = require('./_storage.js')

async function getGoogle (headers, params, res) {
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

  const url = new URL('https://accounts.google.com')

  url.pathname = '/o/oauth2/v2/auth'
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_ID,
    redirect_uri: `https://${process.env.DOMAIN}/api/google`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    state: jwt.sign({ uri: params.redirect_uri, state: params.state }, process.env.JWT_SECRET, { expiresIn: '5m' })
  }).toString()

  res.writeHead(302, { Location: url })
  res.end()

  await storage.setUsage(params.client_id, 'google')
}

async function postGoogle (headers, params, res) {
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
  const profile = await getProfile(accessToken)

  const code = await storage.saveUser({
    id: profile.id,
    email: profile.emails?.[0]?.value,
    name: profile.displayName,
    provider: 'google'
  })

  const query = { code }

  if (decodedState.state) {
    query.state = decodedState.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(302, { Location: `${decodedState.uri}?${queryString}` })
  res.end()
}

async function getToken (code) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({
      client_id: process.env.GOOGLE_ID,
      client_secret: process.env.GOOGLE_SECRET,
      code,
      redirect_uri: `https://${process.env.DOMAIN}/api/google`,
      grant_type: 'authorization_code'
    }).toString()

    const options = {
      host: 'www.googleapis.com',
      port: 443,
      method: 'POST',
      path: '/oauth2/v4/token',
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

        if (res.statusCode === 200 && data.access_token) {
          resolve(data.access_token)
        } else {
          reject(data.error_description?.data)
        }
      })
    }).on('error', (err) => {
      reject(err)
    }).write(query)
  })
}

async function getProfile (accessToken) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://www.googleapis.com')

    url.pathname = '/plus/v1/people/me'
    url.search = new URLSearchParams({ access_token: accessToken }).toString()

    https.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        data = JSON.parse(data)

        if (res.statusCode === 200) {
          resolve(data)
        } else {
          reject(data.error_description?.data)
        }
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

module.exports = {
  getGoogle,
  postGoogle
}
