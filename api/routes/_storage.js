const { createClient } = require('redis')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const YAML = require('yaml')
const fs = require('node:fs/promises')
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb') // ES Modules import

const redis = createClient({ url: process.env.REDIS })

redis.on('error', (err) => console.log('Redis Client Error', err))

async function setEmailSession (data) {
  const code = String(Math.round(Math.random() * 1000000)).padStart(6, '0')

  await redis.connect()
  await redis.set(`email:${data.email}:${code}`, JSON.stringify(data))
  await redis.disconnect()

  return code
}

async function getEmailSession (email, code) {
  await redis.connect()

  const key = `email:${email}:${code}`
  const emailSession = await redis.get(key)

  if (!emailSession) {
    await redis.disconnect()
    return
  }

  await redis.del(key)
  await redis.disconnect()

  return JSON.parse(emailSession)
}

async function setPhoneSession (data) {
  const code = String(Math.round(Math.random() * 1000000)).padStart(6, '0')

  await redis.connect()
  await redis.set(`phone:${data.phone}:${code}`, JSON.stringify(data))
  await redis.disconnect()

  return code
}

async function getPhoneSession (phone, code) {
  await redis.connect()

  const key = `phone:${phone}:${code}`
  const phoneSession = await redis.get(key)

  if (!phoneSession) {
    await redis.disconnect()
    return
  }

  await redis.del(key)
  await redis.disconnect()

  return JSON.parse(phoneSession)
}

async function setMidSession (data) {
  const code = crypto.randomUUID().replaceAll('-', '')

  await redis.connect()
  await redis.set(`mobileid:${data.idcode}:${code}`, JSON.stringify(data))
  await redis.disconnect()

  return code
}

async function getMidSession (idcode, code, doRemove) {
  await redis.connect()

  const key = `mobileid:${idcode}:${code}`
  const midSession = await redis.get(key)

  if (!midSession) {
    await redis.disconnect()
    return
  }

  if (doRemove) {
    await redis.del(key)
  }
  await redis.disconnect()

  return JSON.parse(midSession)
}

async function setSidSession (data) {
  const code = crypto.randomUUID().replaceAll('-', '')

  await redis.connect()
  await redis.set(`smartid:${data.idcode}:${code}`, JSON.stringify(data))
  await redis.disconnect()

  return code
}

async function getSidSession (idcode, code, doRemove) {
  await redis.connect()

  const key = `smartid:${idcode}:${code}`
  const midSession = await redis.get(key)

  if (!midSession) {
    await redis.disconnect()
    return
  }

  if (doRemove) {
    await redis.del(key)
  }
  await redis.disconnect()

  return JSON.parse(midSession)
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

  return jwt.sign(JSON.parse(user), process.env.JWT_SECRET, { expiresIn, notBefore: 0 })
}

async function getClient (clientId) {
  const file = await fs.readFile(process.env.CLIENTS_YAML, 'utf8')
  const clients = YAML.parse(file)

  return clients.find(client => client.id === clientId)
}

async function setUsage (client, provider) {
  const dynamodb = new DynamoDBClient({
    region: process.env.AWS_SES_REGION,
    credentials: {
      accessKeyId: process.env.AWS_SES_ID,
      secretAccessKey: process.env.AWS_SES_KEY
    }
  })

  const config = {
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: {} },
    UpdateExpression: 'SET requests = if_not_exists(requests, :zero) + :one',
    ExpressionAttributeValues: {
      ':zero': { N: '0' },
      ':one': { N: '1' }
    },
    ReturnValues: 'UPDATED_NEW'
  }

  const now = new Date().toISOString()

  config.Key.date.S = `${provider}-${now.substring(0, 4)}`
  await dynamodb.send(new UpdateItemCommand(config))

  config.Key.date.S = `${provider}-${now.substring(0, 7)}`
  await dynamodb.send(new UpdateItemCommand(config))

  config.Key.date.S = `${provider}-${now.substring(0, 10)}`
  await dynamodb.send(new UpdateItemCommand(config))

  config.Key.date.S = `${provider}-${now}`
  await dynamodb.send(new UpdateItemCommand(config))
}

async function getUsage (client) {
  const dynamodb = new DynamoDBClient({
    region: process.env.AWS_SES_REGION,
    credentials: {
      accessKeyId: process.env.AWS_SES_ID,
      secretAccessKey: process.env.AWS_SES_KEY
    }
  })

  const providers = [
    'apple',
    'google',
    'smart-id',
    'mobile-id',
    'id-card',
    'e-mail',
    'phone'
  ]

  const result = {
    year: {},
    month: {},
    today: {}
  }

  const config = {
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: {} }
  }

  for await (const provider of providers) {
    const now = new Date()
    const nowStr = now.toISOString()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = lastMonth.toISOString()

    config.Key.date.S = `${provider}-${nowStr.substring(0, 4)}`
    const { Item: yearItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${lastMonthStr.substring(0, 7)}`
    const { Item: lastMonthItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${nowStr.substring(0, 7)}`
    const { Item: monthItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${nowStr.substring(0, 10)}`
    const { Item: todayItem } = await dynamodb.send(new GetItemCommand(config))

    result.year[provider] = parseInt(yearItem?.requests?.N ?? '0')
    result.lastMonth[provider] = parseInt(lastMonthItem?.requests?.N ?? '0')
    result.month[provider] = parseInt(monthItem?.requests?.N ?? '0')
    result.today[provider] = parseInt(todayItem?.requests?.N ?? '0')
  }

  return result
}

module.exports = {
  setEmailSession,
  getEmailSession,
  setPhoneSession,
  getPhoneSession,
  setMidSession,
  getMidSession,
  setSidSession,
  getSidSession,
  saveUser,
  getToken,
  getClient,
  setUsage,
  getUsage
}
