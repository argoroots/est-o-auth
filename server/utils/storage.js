
import { randomUUID } from 'crypto'
import { DynamoDBClient, DeleteItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb' // ES
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
      data: { S: JSON.stringify(data) }
    }
  }

  await dynamodb.send(new PutItemCommand(command))
}

export async function getSessionData (id) {
  const command = {
    TableName: 'oauth-session',
    Key: { id: { S: id } }
  }

  const { Item: item } = await dynamodb.send(new GetItemCommand(command))

  if (!item) return

  await dynamodb.send(new DeleteItemCommand(command))

  return JSON.parse(item.data.S)
}

export async function saveUser (data) {
  const code = randomUUID().replaceAll('-', '').toUpperCase()

  await setSessionData(`user:${code}`, data)

  return code
}

export async function getToken (code, expiresIn) {
  const user = await getSessionData(`user:${code}`)

  if (!user) return

  return jwt.sign(user, config.jwtSecret, { expiresIn, notBefore: 0, subject: user.email })
}
