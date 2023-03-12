import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const client = await getClient(event)
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
