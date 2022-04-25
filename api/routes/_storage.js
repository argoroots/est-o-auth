const crypto = require('crypto')
const redis = require('redis')
const jwt = require('jsonwebtoken')

const client = redis.createClient({ url: process.env.REDIS })

client.on('error', (err) => console.log('Redis Client Error', err))

async function saveEmail (email) {
  const code = '000000' + Math.round(Math.random() * 1000000)

  await client.connect()
  await client.set(`email:${email}:${code}`, JSON.stringify({ email }))
  await client.disconnect()

  return code
}

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

  if (!user) {
    await client.disconnect()
    return
  }

  await client.del('user:' + code)
  await client.disconnect()

  return jwt.sign(JSON.parse(user), process.env.JWT_SECRET, { expiresIn })
}

module.exports = {
  saveEmail,
  saveUser,
  getToken
}
