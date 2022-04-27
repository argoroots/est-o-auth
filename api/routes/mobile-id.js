const crypto = require('crypto')
const storage = require('./_storage.js')

async function postCode (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
    return
  }

  if (!params.redirect_uri) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter redirect_uri is required' }))
    return
  }

  if (!params.idc) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter idc is required' }))
    return
  }

  if (!params.phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter phone is required' }))
    return
  }

  const { pin, hashBuffer } = generatePin()

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ pin }))
}

function generatePin () {
  const hash = crypto.randomBytes(32).toString('hex')
  const hashBuffer = Buffer.from(hash, 'hex')
  const binArray = []

  for (const v of hashBuffer.values()) {
    binArray.push(v.toString(2).padStart(8, '0'))
  }

  const bin = binArray.join('')
  const newBinary = bin.substring(0, 6) + bin.slice(-7)

  return {
    pin: String(parseInt(newBinary, 2)).padStart(4, '0'),
    hashBuffer
  }
}
