import { PublishCommand } from '@aws-sdk/client-sns'

// Starts a phone login: creates a one-time code and sends it by SMS
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone'])

  if (!isPhone(query.phone)) throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })

  await checkUsageLimit(client.id, 'phone')

  const code = await createOtp('phone', query.phone, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    phone: query.phone
  })

  await getSns().send(new PublishCommand({
    PhoneNumber: query.phone,
    Message: interpolate(getLocale(query.lang).phone.sms, { code })
  }))

  await recordUsage(client, 'phone')

  return { sent: true }
})
