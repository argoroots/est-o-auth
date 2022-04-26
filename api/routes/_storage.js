const { createClient } = require('redis')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const redis = createClient({ url: process.env.REDIS })

redis.on('error', (err) => console.log('Redis Client Error', err))

async function saveEmail (email) {
  const numbers = '000000' + Math.round(Math.random() * 1000000)
  const code = numbers.slice(numbers.length - 6)

  await redis.connect()
  await redis.set(`email:${email}:${code}`, JSON.stringify({ email }))
  await redis.disconnect()

  return code
}

async function getEmail (email, code) {
  await redis.connect()

  const key = `email:${email}:${code}`
  const emailSession = await redis.get(key)

  console.log('key', key)
  console.log('emailSession', emailSession)

  if (!emailSession) {
    await redis.disconnect()
    return
  }

  await redis.del(key)
  await redis.disconnect()

  return JSON.parse(emailSession)
}

async function saveUser (user) {
  const code = crypto.randomUUID().replaceAll('-', '')

  await redis.connect()
  await redis.set('user:' + code, JSON.stringify(user))
  await redis.disconnect()

  return code
}

async function getToken (code, expiresIn) {
  await redis.connect()

  const key = `user:${code}`
  const user = await redis.get(key)

  if (!user) {
    await redis.disconnect()
    return
  }

  await redis.del(key)
  await redis.disconnect()

  return jwt.sign(JSON.parse(user), process.env.JWT_SECRET, { expiresIn })
}

module.exports = {
  saveEmail,
  getEmail,
  saveUser,
  getToken
}
