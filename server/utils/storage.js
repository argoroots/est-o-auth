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

export async function setSessionData (id, data) {
  const command = {
    TableName: 'oauth-session',
    Item: {
      id: { S: id },
      created: { S: new Date().toISOString() },
      data: { S: JSON.stringify(data) }
    }
  }

  await dynamodb.send(new PutItemCommand(command))
}

export async function getSessionData (id, deleteItem) {
  const command = {
    TableName: 'oauth-session',
    Key: { id: { S: id } }
  }

  const { Item: item } = await dynamodb.send(new GetItemCommand(command))

  if (!item) return

  if (deleteItem) await dynamodb.send(new DeleteItemCommand(command))

  return JSON.parse(item.data.S)
}

export async function saveUser (data) {
  const code = randomUUID().replaceAll('-', '').toUpperCase()

  await setSessionData(`user:${code}`, data)

  return code
}

export async function getToken (code, expiresIn) {
  const user = await getSessionData(`user:${code}`, true)

  if (!user) return

  return jwt.sign(user, config.jwtSecret, { expiresIn, notBefore: 0, subject: user.email || user.id })
}

export async function setUsage (client, provider) {
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

export async function getClientConfig (client) {
  if (!client) return

  const config = {
    TableName: 'oauth-clients',
    Key: { id: { S: client } }
  }

  const { Item } = await dynamodb.send(new GetItemCommand(config))

  return {
    id: Item?.id?.S,
    secret: Item?.secret?.S,
    skidText: Item?.skidText?.S,
    redirectUris: Item?.redirectUris?.SS,
    providers: Item?.providers?.SS,
    stripeId: Item?.stripeId?.S
  }
}
