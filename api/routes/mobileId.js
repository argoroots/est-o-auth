const crypto = require('crypto')
const storage = require('./_storage.js')

async function postSession (headers, params, res) {
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

  if (!params.idcode) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter idcode is required' }))
    return
  }

  if (!params.phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter phone is required' }))
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

  const { skSession, consent } = await startMidSession(params.idcode, params.phone)

  const session = await storage.setMidSession({
    redirect_uri: params.redirect_uri,
    state: params.state,
    idcode: params.idcode,
    phone: params.phone,
    skSession
  })

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    consent,
    session
  }))

  await storage.setUsage(params.client_id, 'mobile-id')
}

async function postCode (headers, params, res) {
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

  if (!params.session) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter session is required' }))
    return
  }

  if (!params.idcode) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter idcode is required' }))
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

  const midSession = await storage.getMidSession(params.idcode, params.session, false)

  if (!midSession) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid session or idcode' }))
    return
  }

  const skResponse = await checkMidSession(midSession.skSession)

  if (skResponse !== 'OK') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: skResponse }))
    return
  }

  await storage.getMidSession(params.idcode, params.session, true)

  const code = await storage.saveUser({
    id: midSession.idcode,
    email: `${midSession.idcode}@eesti.ee`,
    provider: 'mobile-id'
  })

  const query = { code }

  if (midSession.state) {
    query.state = midSession.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ redirect: `${midSession.redirect_uri}?${queryString}` }))
}

async function startMidSession (idcode, phone) {
  const hash = crypto.randomBytes(32).toString('hex')
  const hashBuffer = Buffer.from(hash, 'hex')
  const binArray = []

  for (const v of hashBuffer.values()) {
    binArray.push(v.toString(2).padStart(8, '0'))
  }

  const bin = binArray.join('')
  const newBinary = bin.substring(0, 6) + bin.slice(-7)
  const consent = String(parseInt(newBinary, 2)).padStart(4, '0')

  const skResponse = await fetch('https://mid.sk.ee/mid-api/authentication', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relyingPartyName: process.env.MOBILEID_NAME,
      relyingPartyUUID: process.env.MOBILEID_UUID,
      nationalIdentityNumber: idcode,
      phoneNumber: phone,
      hash: hashBuffer.toString('base64'),
      hashType: 'SHA256',
      language: 'EST'
      // displayText: 'This is display text.'
    })
  }).then(response => response.json())

  if (!skResponse.sessionID) {
    throw new Error(skResponse.error || 'Mobile-ID session start failed')
  }

  return {
    consent,
    skSession: skResponse.sessionID
  }
}

async function checkMidSession (sessionId) {
  const skResponse = await fetch(`https://mid.sk.ee/mid-api/authentication/session/${sessionId}?timeoutMs=2000`).then(response => response.json())

  if (skResponse.state === 'RUNNING') {
    return 'RUNNING'
  }

  if (skResponse.state === 'COMPLETE') {
    return skResponse.result
  }

  throw new Error(skResponse.error || 'Mobile-ID session check failed')
}

module.exports = {
  postSession,
  postCode
}
