import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone'])

  const client = await getClient(query)
  const config = useRuntimeConfig()
  const code = String(Math.round(Math.random() * 1000000)).padStart(6, '0')

  await setSessionData(`phone:${query.phone}:${code}`, {
    redirect_uri: query.redirect_uri,
    state: query.state,
    phone: query.phone
  })

  const sns = new SNSClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsId,
      secretAccessKey: config.awsSecret
    }
  })

  await sns.send(new PublishCommand({
    PhoneNumber: query.phone,
    Message: `Your OAuth.ee verification code is ${code}`
  }))

  await setUsage(client.id, 'phone')

  return { sent: true }
})
