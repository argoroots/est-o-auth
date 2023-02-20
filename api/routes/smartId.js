const crypto = require('crypto')
const storage = require('./_storage.js')

async function postSession (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
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

  const client = await storage.getClient(params.client_id)

  if (!client) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid client_id' }))
    return
  }

  const { skSession, consent } = await startSidSession(params.idcode)

  const session = await storage.setSidSession({
    redirect_uri: params.redirect_uri,
    state: params.state,
    idcode: params.idcode,
    skSession
  })

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    consent,
    session
  }))
}

async function postCode (headers, params, res) {
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

  const sidSession = await storage.getSidSession(params.idcode, params.session, false)

  if (!sidSession) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid session or idcode' }))
    return
  }

  const skResponse = await checkSidSession(sidSession.skSession)

  if (skResponse !== 'OK') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: skResponse }))
    return
  }

  await storage.getSidSession(params.idcode, params.session, true)

  const code = await storage.saveUser({
    idcode: sidSession.idcode
  })

  const query = { code }

  if (sidSession.state) {
    query.state = sidSession.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ redirect: `${sidSession.redirect_uri}?${queryString}` }))
}

async function startSidSession (idcode, phone) {
  const hash = crypto.randomBytes(32).toString('hex')
  const hashBuffer = Buffer.from(hash, 'hex')
  const binArray = []

  for (const v of hashBuffer.values()) {
    binArray.push(v.toString(2).padStart(8, '0'))
  }

  const bin = binArray.join('')
  const newBinary = bin.substring(0, 6) + bin.slice(-7)
  const consent = String(parseInt(newBinary, 2)).padStart(4, '0')

  // const skResponse = await fetch(`https://sid.demo.sk.ee/smart-id-rp/v2/authentication/etsi/PNOEE-${idcode}`, {
  const skResponse = await fetch(`https://sid.demo.sk.ee/smart-id-rp/v2/authentication/etsi/PNOEE-${idcode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relyingPartyName: process.env.SMARTID_NAME,
      relyingPartyUUID: process.env.SMARTID_UUID,
      hash: hashBuffer.toString('base64'),
      hashType: 'SHA256',
      allowedInteractionsOrder: [
        {
          type: 'verificationCodeChoice'
          // displayText60: 'Up to 60 characters of text here..'
        },
        {
          type: 'displayTextAndPIN'
          // displayText60: 'Up to 60 characters of text here..'
        }
      ]
    })
  }).then(response => response.json())

  if (!skResponse.sessionID) {
    throw new Error(skResponse.error || 'Smart-ID session start failed')
  }

  return {
    consent,
    skSession: skResponse.sessionID
  }
}

async function checkSidSession (sessionId) {
  // const skResponse = await fetch(`https://rp-api.smart-id.com/v2/session/${sessionId}?timeoutMs=2000`).then(response => response.json())
  const skResponse = await fetch(`https://sid.demo.sk.ee/smart-id-rp/v2/session/${sessionId}?timeoutMs=2000`).then(response => response.json())

  if (skResponse.state === 'RUNNING') {
    return 'RUNNING'
  }

  if (skResponse.state === 'COMPLETE') {
    return skResponse.result?.endResult
  }

  throw new Error(skResponse.error || 'Smart-ID session check failed')
}

module.exports = {
  postSession,
  postCode
}
