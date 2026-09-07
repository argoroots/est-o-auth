import { SendEmailCommand } from '@aws-sdk/client-ses'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'e-mail', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'email'])

  if (!isEmail(query.email)) throw createError({ statusCode: 400, statusMessage: 'Invalid e-mail address' })

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
  const url = `${getOrigin(event)}/auth/e-mail?${search}`
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

  await setBillingUsage(client.stripeId, 'e-mail')
  await setUsage(client.id, 'e-mail')

  return { sent: true }
})
