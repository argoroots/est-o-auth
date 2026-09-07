import { randomUUID } from 'crypto'
import { DynamoDBClient, DeleteItemCommand, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb' // ES
import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()
const dynamodb = new DynamoDBClient({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsId,
    secretAccessKey: config.awsSecret
  }
})

// Hard cap of authentications per client per calendar month
const MONTHLY_LIMITS = {
  apple: undefined,
  google: undefined,
  'smart-id': 1000,
  'mobile-id': 1000,
  'id-card': 1000,
  'e-mail': 100000,
  phone: 1000
}

// Per-target rate limit: rejects with 429 if the key was used within windowMs, otherwise records the use.
export async function checkCooldown (key, windowMs) {
  if (await getSessionData(`cooldown:${key}`, false, windowMs)) {
    throw createError({ statusCode: 429, statusMessage: 'Please wait before trying again' })
  }

  await setSessionData(`cooldown:${key}`, {})
}

// DynamoDB TTL (epoch seconds in the `ttl` attribute; enable TTL on oauth-session with that attribute name).
// Logical expiry is enforced on read via SESSION_TTL; this only governs physical cleanup.
const SESSION_ITEM_TTL_S = 24 * 60 * 60

// Stores a session. Pass createdAt (ms) when rewriting an existing session so its expiry is not extended.
export async function setSessionData (id, data, createdAt = Date.now()) {
  const command = {
    TableName: 'oauth-session',
    Item: {
      id: { S: id },
      created: { S: new Date(createdAt).toISOString() },
      ttl: { N: String(Math.floor(createdAt / 1000) + SESSION_ITEM_TTL_S) },
      data: { S: JSON.stringify(data) }
    }
  }

  await dynamodb.send(new PutItemCommand(command))
}

// Maximum age of stored sessions, enforced on read regardless of table TTL
export const SESSION_TTL = {
  NONCE: 5 * 60 * 1000, // Web eID challenge nonce (recommended lifetime 5 min)
  OTP: 10 * 60 * 1000, // e-mail / phone verification codes
  SK: 10 * 60 * 1000, // Smart-ID / Mobile-ID sessions (SK expires them sooner)
  AUTH_CODE: 10 * 60 * 1000 // OAuth authorization codes (RFC 6749 recommends max 10 min)
}

// Reads a session. With deleteItem the read and delete are one atomic DynamoDB call, so a session
// can be consumed exactly once even under concurrent requests. Expired sessions are treated as absent.
export async function getSessionData (id, deleteItem, maxAgeMs) {
  const command = {
    TableName: 'oauth-session',
    Key: { id: { S: id } }
  }

  const item = deleteItem
    ? (await dynamodb.send(new DeleteItemCommand({ ...command, ReturnValues: 'ALL_OLD' }))).Attributes
    : (await dynamodb.send(new GetItemCommand(command))).Item

  if (!item) return

  if (maxAgeMs && Date.now() - Date.parse(item.created.S) > maxAgeMs) return

  return JSON.parse(item.data.S)
}

// Issues an authorization code bound to the client and redirect URI that started the flow (RFC 6749 §4.1.3)
export async function saveUser (user, { client_id: clientId, redirect_uri: redirectUri }) {
  const code = randomUUID().replaceAll('-', '').toUpperCase()

  await setSessionData(`user:${code}`, { user, clientId, redirectUri })

  return code
}

// Exchanges a code for an access token. The code is single-use and must be redeemed by the same
// client it was issued to; if the client sends redirect_uri it must match the one used at authorization.
export async function getToken (code, clientId, redirectUri, expiresIn) {
  const session = await getSessionData(`user:${code}`, true, SESSION_TTL.AUTH_CODE)

  if (!session) return
  if (session.clientId !== clientId) return
  if (redirectUri && session.redirectUri !== redirectUri) return

  const { user } = session

  return jwt.sign(user, config.jwtSecret, { expiresIn, notBefore: 0, subject: user.email || user.id })
}

// Increments the year, month and day counters for the client and provider, and writes one row per
// request. Usage rows are kept indefinitely (statistics).
export async function setUsage (client, provider) {
  const now = new Date().toISOString()
  const counter = (date) => new UpdateItemCommand({
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: { S: `${provider}-${date}` } },
    UpdateExpression: 'SET requests = if_not_exists(requests, :zero) + :one',
    ExpressionAttributeValues: {
      ':zero': { N: '0' },
      ':one': { N: '1' }
    }
  })

  await dynamodb.send(counter(now.substring(0, 4)))
  await dynamodb.send(counter(now.substring(0, 7)))
  await dynamodb.send(counter(now.substring(0, 10)))
  await dynamodb.send(counter(now))
}

export async function checkUsageLimit (client, provider) {
  const limit = MONTHLY_LIMITS[provider]

  if (!limit) return

  const month = new Date().toISOString().substring(0, 7)
  const command = {
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: { S: `${provider}-${month}` } }
  }

  const { Item } = await dynamodb.send(new GetItemCommand(command))
  const used = parseInt(Item?.requests?.N ?? '0')

  if (used < limit) return

  console.warn(`[limit] client ${client} reached monthly limit of ${limit} ${provider} authentications (${used})`)

  throw createError({ statusCode: 429, statusMessage: 'Something went wrong' })
}

export async function getUsage (client) {
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
    today: {},
    yesterday: {},
    month: {},
    lastMonth: {},
    year: {}
  }

  const config = {
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: {} }
  }

  for await (const provider of providers) {
    const now = new Date()
    const nowStr = now.toISOString()
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = lastMonth.toISOString()

    config.Key.date.S = `${provider}-${nowStr.substring(0, 10)}`
    const { Item: todayItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${yesterdayStr.substring(0, 10)}`
    const { Item: yesterdayItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${lastMonthStr.substring(0, 7)}`
    const { Item: lastMonthItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${nowStr.substring(0, 7)}`
    const { Item: monthItem } = await dynamodb.send(new GetItemCommand(config))

    config.Key.date.S = `${provider}-${nowStr.substring(0, 4)}`
    const { Item: yearItem } = await dynamodb.send(new GetItemCommand(config))

    result.today[provider] = parseInt(todayItem?.requests?.N ?? '0')
    result.yesterday[provider] = parseInt(yesterdayItem?.requests?.N ?? '0')
    result.lastMonth[provider] = parseInt(lastMonthItem?.requests?.N ?? '0')
    result.month[provider] = parseInt(monthItem?.requests?.N ?? '0')
    result.year[provider] = parseInt(yearItem?.requests?.N ?? '0')
  }

  return result
}

export async function saveClient ({ id, secret, skidText, providers, redirectUris, stripeId }) {
  const command = {
    TableName: 'oauth-clients',
    Item: {
      id: { S: id },
      secret: { S: secret },
      skidText: { S: skidText },
      providers: { SS: providers },
      stripeId: { S: stripeId },
      created: { S: new Date().toISOString() }
    },
    ConditionExpression: 'attribute_not_exists(id)'
  }

  if (redirectUris?.length) command.Item.redirectUris = { SS: redirectUris }

  try {
    await dynamodb.send(new PutItemCommand(command))
  }
  catch (error) {
    if (error.name === 'ConditionalCheckFailedException') throw createError({ statusCode: 409, statusMessage: 'Client already created' })

    throw error
  }
}

export async function getClientConfig (client) {
  if (!client) return

  const config = {
    TableName: 'oauth-clients',
    Key: { id: { S: client } }
  }

  const { Item } = await dynamodb.send(new GetItemCommand(config))

  if (!Item) return

  return {
    id: Item?.id?.S,
    secret: Item?.secret?.S,
    skidText: Item?.skidText?.S,
    redirectUris: Item?.redirectUris?.SS,
    providers: Item?.providers?.SS,
    stripeId: Item?.stripeId?.S
  }
}
