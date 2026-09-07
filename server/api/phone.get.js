import { PublishCommand } from '@aws-sdk/client-sns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'phone', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'phone'])

  if (!isPhone(query.phone)) throw createError({ statusCode: 400, statusMessage: 'Invalid phone number' })

  await checkUsageLimit(client.id, 'phone')

  const code = await createOtp(`phone:${query.phone}`, {
    client_id: client.id,
    redirect_uri: query.redirect_uri,
    state: query.state,
    phone: query.phone
  })

  await getSns().send(new PublishCommand({
    PhoneNumber: query.phone,
    Message: interpolate(getLocale(query.lang).phone.sms, { code })
  }))

  await setBillingUsage(client.stripeId, 'phone')
  await setUsage(client.id, 'phone')

  return { sent: true }
})
