import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone'])

  if (!isPhone(query.phone)) throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })

  const client = await getClient(query)

  await checkUsageLimit(client.id, 'phone')

  const config = useRuntimeConfig()

  const code = await createOtp(`phone:${query.phone}`, {
    client_id: client.id,
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

  await setBillingUsage(client.stripeId, 'phone')
  await setUsage(client.id, 'phone')

  return { sent: true }
})
