const crypto = require('crypto')
const redis = require('redis')
const jwt = require('jsonwebtoken')

export async function saveUser (user) {
  const client = redis.createClient({ url: process.env.REDIS })
  const code = crypto.randomUUID()
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '15m' })

  client.on('error', (err) => console.log('Redis Client Error', err))

  await client.connect()
  await client.set(code, token)

  return code
}
