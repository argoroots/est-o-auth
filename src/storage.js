const crypto = require('crypto')
const redis = require('redis')
const jwt = require('jsonwebtoken')

const client = redis.createClient({ url: process.env.REDIS })
client.on('error', (err) => console.log('Redis Client Error', err))

async function saveUser (user) {
  const code = crypto.randomUUID().replaceAll('-', '')

  await client.connect()
  await client.set('user:' + code, JSON.stringify(user))
  await client.disconnect()

  return code
}

async function getToken (code, expiresIn) {
  await client.connect()
  const user = await client.get('user:' + code)
  await client.del('user:' + code)
  await client.disconnect()

  const token = jwt.sign(JSON.parse(user), process.env.JWT_SECRET, { expiresIn })

  return token
}

module.exports = {
  saveUser,
  getToken
}
