import { SendEmailCommand } from '@aws-sdk/client-ses'

// Starts an e-mail login: creates a one-time code and mails it with a magic link
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'email'])

  if (!isEmail(query.email)) throw createError({ statusCode: 400, statusMessage: 'Invalid e-mail address' })

  await checkUsageLimit(client.id, 'e-mail')

  const config = useRuntimeConfig()

  // NUXT_TEST_USER=client_id:email:code fixes the code for that e-mail, on that client only
  const [testClient, testEmail, testCode] = config.testUser?.split(':') ?? []
  const fixedCode = testCode && client.id === testClient && query.email === testEmail ? testCode : undefined

  const code = await createOtp('email', query.email, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    email: query.email
  }, fixedCode)

  const url = `${getOrigin(event)}/auth/e-mail?${new URLSearchParams({ ...query, code })}`
  const { email: text } = getLocale(query.lang)

  await getSes().send(new SendEmailCommand({
    Source: config.emailFrom,
    Destination: {
      ToAddresses: [query.email]
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: text.mailSubject
      },
      Body: {
        Charset: 'UTF-8',
        Html: {
          Data: `${interpolate(text.mailCode, { code: `<strong>${code}</strong>` })}<br><br><a href="${url}">${text.mailLink}</a>`
        }
      }
    }
  }))

  await recordUsage(client, 'e-mail')

  return { sent: true }
})
