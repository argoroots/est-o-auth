import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'email'])

  if (!isEmail(query.email)) throw createError({ statusCode: 400, statusMessage: 'Invalid e-mail address' })

  const client = await getClient(query)

  await checkUsageLimit(client.id, 'e-mail')

  const config = useRuntimeConfig()
  const [testEmail, testCode] = config.testUser?.split(':') ?? []
  const fixedCode = testEmail && testCode && query.email === testEmail ? testCode : undefined

  const code = await createOtp(`email:${query.email}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    email: query.email
  }, fixedCode)

  const search = new URLSearchParams({ ...query, code }).toString()
  const url = `${config.url}/auth/e-mail?${search}`

  const ses = new SESClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsId,
      secretAccessKey: config.awsSecret
    }
  })

  await ses.send(new SendEmailCommand({
    Source: config.emailFrom,
    Destination: {
      ToAddresses: [query.email]
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'Verification Code'
      },
      Body: {
        Charset: 'UTF-8',
        Html: {
          Data: `Your verification code is <strong>${code}</strong><br><br>... or just <a href="${url}">open this link</a>.`
        }
      }
    }
  }))

  await setBillingUsage(client.stripeId, 'e-mail')
  await setUsage(client.id, 'e-mail')

  return { sent: true }
})
