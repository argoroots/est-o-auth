import { createHash, randomUUID } from 'crypto'
import { BatchGetItemCommand, DeleteItemCommand, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()

// Maximum age of stored sessions, enforced on read regardless of table TTL
export const SESSION_TTL = {
  NONCE: 5 * 60 * 1000, // Web eID challenge nonce (recommended lifetime 5 min)
  OTP: 10 * 60 * 1000, // e-mail / phone verification codes
  SK: 10 * 60 * 1000, // Smart-ID / Mobile-ID sessions (SK expires them sooner)
  AUTH_CODE: 10 * 60 * 1000 // OAuth authorization codes (RFC 6749 recommends max 10 min)
}

// DynamoDB removes a row this long after it logically expires (enable TTL on the `ttl` attribute)
const TTL_GRACE_S = 60

// Session key for a personal identifier (e-mail, phone, ID code); hashed so the identifier is never a row key
export function targetKey (prefix, target) {
  return `${prefix}:${createHash('sha256').update(target).digest('hex')}`
}

// Per-target rate limit: 429 if the target was used within windowMs, otherwise records the use
export async function checkCooldown (type, target, windowMs) {
  const recorded = await setSessionDataUnlessRecent(targetKey(`cooldown:${type}`, target), {}, windowMs)

  if (!recorded) throw apiError(429, 'limit.cooldown')
}

// DynamoDB item for a session created at createdAt (ms) and valid for maxAgeMs
function sessionItem (id, data, createdAt, maxAgeMs) {
  return {
    id: { S: id },
    created: { S: new Date(createdAt).toISOString() },
    ttl: { N: String(Math.floor(createdAt / 1000) + Math.ceil(maxAgeMs / 1000) + TTL_GRACE_S) },
    data: { S: JSON.stringify(data) }
  }
}

// Stores a session that is valid for maxAgeMs (one of SESSION_TTL)
export async function setSessionData (id, data, maxAgeMs) {
  await getDynamo().send(new PutItemCommand({
    TableName: 'oauth-session',
    Item: sessionItem(id, data, Date.now(), maxAgeMs)
  }))
}

// Stores a session unless one was created within windowMs; one conditional write, so concurrent requests cannot both pass
export async function setSessionDataUnlessRecent (id, data, windowMs, maxAgeMs = windowMs) {
  const now = Date.now()

  try {
    await getDynamo().send(new PutItemCommand({
      TableName: 'oauth-session',
      Item: sessionItem(id, data, now, maxAgeMs),
      // ISO timestamps compare correctly as strings
      ConditionExpression: 'attribute_not_exists(id) OR created <= :threshold',
      ExpressionAttributeValues: { ':threshold': { S: new Date(now - windowMs).toISOString() } }
    }))

    return true
  }
  catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return false

    throw error
  }
}

// Counts one attempt and returns { data, attempts }, or undefined when missing, expired or over maxAttempts (atomic)
export async function countSessionAttempt (id, maxAttempts, maxAgeMs) {
  let item

  try {
    ({ Attributes: item } = await getDynamo().send(new UpdateItemCommand({
      TableName: 'oauth-session',
      Key: { id: { S: id } },
      UpdateExpression: 'SET attempts = if_not_exists(attempts, :zero) + :one',
      ConditionExpression: 'attribute_exists(id) AND (attribute_not_exists(attempts) OR attempts < :max)',
      ExpressionAttributeValues: {
        ':zero': { N: '0' },
        ':one': { N: '1' },
        ':max': { N: String(maxAttempts) }
      },
      ReturnValues: 'ALL_NEW'
    })))
  }
  catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return

    throw error
  }

  if (maxAgeMs && Date.now() - Date.parse(item.created.S) > maxAgeMs) return

  return { data: JSON.parse(item.data.S), attempts: parseInt(item.attempts.N) }
}

// Reads a session; with deleteItem the read and delete are one atomic call, so it can be consumed exactly once
export async function getSessionData (id, deleteItem, maxAgeMs) {
  const command = {
    TableName: 'oauth-session',
    Key: { id: { S: id } }
  }

  const item = deleteItem
    ? (await getDynamo().send(new DeleteItemCommand({ ...command, ReturnValues: 'ALL_OLD' }))).Attributes
    : (await getDynamo().send(new GetItemCommand(command))).Item

  if (!item) return

  if (maxAgeMs && Date.now() - Date.parse(item.created.S) > maxAgeMs) return

  return JSON.parse(item.data.S)
}

// Loads a live session or throws 403; with clientId, the session must also belong to that client
export async function requireSession (id, maxAgeMs, clientId) {
  const session = await getSessionData(id, false, maxAgeMs)

  if (!session) throw apiError(403, 'session.invalid')
  if (clientId && session.client_id !== clientId) throw apiError(403, 'session.otherClient')

  return session
}

// Deletes a session so it completes exactly once; a concurrent completion gets 403
export async function consumeSession (id) {
  if (!await getSessionData(id, true)) throw apiError(403, 'session.used')
}

// Issues an authorization code bound to the client and redirect URI that started the flow (RFC 6749 §4.1.3)
export async function saveUser (user, { client_id: clientId, redirect_uri: redirectUri }) {
  const code = randomUUID().replaceAll('-', '').toUpperCase()

  await setSessionData(`user:${code}`, { user, clientId, redirectUri }, SESSION_TTL.AUTH_CODE)

  return code
}

// Exchanges a single-use code for an access token; the client and, if sent, redirect_uri must match the issue
export async function getToken (code, clientId, redirectUri, expiresIn) {
  const session = await getSessionData(`user:${code}`, true, SESSION_TTL.AUTH_CODE)

  if (!session) return
  if (session.clientId !== clientId) return
  if (redirectUri && session.redirectUri !== redirectUri) return

  const { user } = session

  return jwt.sign(user, config.jwtSecret, { expiresIn, notBefore: 0, subject: user.email || user.id })
}

// Increments the year, month and day counters and writes one row per request; usage rows are kept indefinitely
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

  await Promise.all([
    now.substring(0, 4),
    now.substring(0, 7),
    now.substring(0, 10),
    now
  ].map((date) => getDynamo().send(counter(date))))
}

// Throws 429 once the client has used its monthly allowance of the provider
export async function checkUsageLimit (client, provider) {
  const limit = PROVIDERS.find((p) => p.id === provider)?.limit

  if (!limit) return

  const month = new Date().toISOString().substring(0, 7)
  const command = {
    TableName: 'oauth-usage',
    Key: { client: { S: client }, date: { S: `${provider}-${month}` } }
  }

  const { Item } = await getDynamo().send(new GetItemCommand(command))
  const used = parseInt(Item?.requests?.N ?? '0')

  if (used < limit) return

  console.warn(`[limit] client ${client} reached monthly limit of ${limit} ${provider} authentications (${used})`)

  throw apiError(429, 'limit.monthly')
}

// Per-provider counters for today, yesterday, this month, last month and this year (UTC, like setUsage)
export async function getUsage (client) {
  const now = new Date()
  const utc = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString()
  const periods = {
    today: now.toISOString().substring(0, 10),
    yesterday: utc(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1).substring(0, 10),
    month: now.toISOString().substring(0, 7),
    lastMonth: utc(now.getUTCFullYear(), now.getUTCMonth() - 1, 1).substring(0, 7),
    year: now.toISOString().substring(0, 4)
  }

  // One batch read for every provider x period (35 keys, under the 100-key limit)
  const keys = PROVIDER_IDS.flatMap((provider) => Object.values(periods).map((date) => ({
    client: { S: client },
    date: { S: `${provider}-${date}` }
  })))

  const { Responses } = await getDynamo().send(new BatchGetItemCommand({ RequestItems: { 'oauth-usage': { Keys: keys } } }))
  const counts = Object.fromEntries((Responses?.['oauth-usage'] ?? []).map((item) => [item.date.S, parseInt(item.requests?.N ?? '0')]))

  const result = {}

  for (const [period, date] of Object.entries(periods)) {
    result[period] = Object.fromEntries(PROVIDER_IDS.map((provider) => [provider, counts[`${provider}-${date}`] ?? 0]))
  }

  return result
}

// Creates a client row; 409 if the id already exists
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
    await getDynamo().send(new PutItemCommand(command))
  }
  catch (error) {
    if (error.name === 'ConditionalCheckFailedException') throw apiError(409, 'signup.clientExists')

    throw error
  }
}

// Client description as { lang: text }; stored as a plain string (English) or a map keyed by language
function readDescription (attr) {
  if (attr?.S) return { en: attr.S }
  if (attr?.M) return Object.fromEntries(Object.entries(attr.M).map(([lang, v]) => [lang, v.S]))
}

// Loads a client row by id, or undefined
export async function getClientConfig (client) {
  if (!client) return

  const { Item } = await getDynamo().send(new GetItemCommand({
    TableName: 'oauth-clients',
    Key: { id: { S: client } }
  }))

  if (!Item) return

  return {
    id: Item.id?.S,
    secret: Item.secret?.S,
    skidText: Item.skidText?.S,
    description: readDescription(Item.description),
    redirectUris: Item.redirectUris?.SS,
    providers: Item.providers?.SS,
    stripeId: Item.stripeId?.S
  }
}
