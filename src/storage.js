const crypto = require('crypto')
const redis = require('redis')
const jwt = require('jsonwebtoken')

const client = redis.createClient({ url: process.env.REDIS })
client.on('error', (err) => console.log('Redis Client Error', err))

async function saveUser (user) {
  const code = crypto.randomUUID().replaceAll('-', '')

  await client.connect()
  await client.set('user:' + code, JSON.stringify(user))

  return code
}

module.exports = {
  saveUser
}
