import { randomUUID } from 'crypto'
import { DynamoDBClient, BatchGetItemCommand, DeleteItemCommand, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()
const dynamodb = new DynamoDBClient({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsId,
    secretAccessKey: config.awsSecret
  }
})

// Per-target rate limit: rejects with 429 if the key was used within windowMs, otherwise records the use.
export async function checkCooldown (key, windowMs) {
  if (await getSessionData(`cooldown:${key}`, false, windowMs)) {
    throw createError({ statusCode: 429, statusMessage: 'Please wait before trying again' })
  }

  // Marker only needs to outlive its window; expire it soon after rather than the default day
  await setSessionData(`cooldown:${key}`, {}, Date.now(), Math.ceil(windowMs / 1000) + 60)
}

// DynamoDB TTL (epoch seconds in the `ttl` attribute; enable TTL on oauth-session with that attribute name).
// Logical expiry is enforced on read via SESSION_TTL; this only governs physical cleanup.
const SESSION_ITEM_TTL_S = 24 * 60 * 60

// Stores a session. Pass createdAt (ms) when rewriting an existing session so its expiry is not extended;
// ttlSeconds overrides how long DynamoDB keeps the row.
export async function setSessionData (id, data, createdAt = Date.now(), ttlSeconds = SESSION_ITEM_TTL_S) {
  const command = {
    TableName: 'oauth-session',
    Item: {
      id: { S: id },
      created: { S: new Date(createdAt).toISOString() },
      ttl: { N: String(Math.floor(createdAt / 1000) + ttlSeconds) },
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
  const limit = PROVIDERS.find((p) => p.id === provider)?.limit

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
  // Counters are keyed by UTC date (see setUsage), so derive the periods in UTC as well
  const now = new Date()
  const utc = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString()
  const periods = {
    today: now.toISOString().substring(0, 10),
    yesterday: utc(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1).substring(0, 10),
    month: now.toISOString().substring(0, 7),
    lastMonth: utc(now.getUTCFullYear(), now.getUTCMonth() - 1, 1).substring(0, 7),
    year: now.toISOString().substring(0, 4)
  }

  // One batch read for all provider x period counters (35 keys, well under the 100-key limit)
  const keys = PROVIDER_IDS.flatMap((provider) => Object.values(periods).map((date) => ({
    client: { S: client },
    date: { S: `${provider}-${date}` }
  })))

  const { Responses } = await dynamodb.send(new BatchGetItemCommand({ RequestItems: { 'oauth-usage': { Keys: keys } } }))
  const counts = Object.fromEntries((Responses?.['oauth-usage'] ?? []).map((item) => [item.date.S, parseInt(item.requests?.N ?? '0')]))

  const result = {}

  for (const [period, date] of Object.entries(periods)) {
    result[period] = Object.fromEntries(PROVIDER_IDS.map((provider) => [provider, counts[`${provider}-${date}`] ?? 0]))
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

// `description` on oauth-clients is either a string (one language) or a Map keyed by language code,
// e.g. { en: '...', et: '...' }. Always returned as an object keyed by language.
function readDescription (attr) {
  if (attr?.S) return { en: attr.S }
  if (attr?.M) return Object.fromEntries(Object.entries(attr.M).map(([lang, v]) => [lang, v.S]))
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
    description: readDescription(Item?.description),
    redirectUris: Item?.redirectUris?.SS,
    providers: Item?.providers?.SS,
    stripeId: Item?.stripeId?.S
  }
}
