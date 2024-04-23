import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  await checkRequest(query, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(query)
  const config = useRuntimeConfig()
  const code = String(Math.round(Math.random() * 1000000)).padStart(6, '0')

  await setSessionData(`email:${query.email}:${code}`, {
    redirect_uri: query.redirect_uri,
    state: query.state,
    email: query.email
  })

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

  await setUsage(client.id, 'e-mail')

  return { sent: true }
})
