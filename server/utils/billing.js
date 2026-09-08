const { url } = useRuntimeConfig()

// Maps active recurring Stripe price ids to provider ids via meters named oauth_<provider>
async function getProviderPrices () {
  const { billing, prices } = getStripe()

  const meters = await billing.meters.list({ status: 'active', limit: 100 })
  const providerByMeter = Object.fromEntries(
    meters.data
      .filter((meter) => meter.event_name.startsWith('oauth_'))
      .map((meter) => [meter.id, meter.event_name.substring(6)])
  )

  const allPrices = await prices.list({ active: true, type: 'recurring', limit: 100 })

  return Object.fromEntries(
    allPrices.data
      .filter((price) => providerByMeter[price.recurring?.meter])
      .map((price) => [price.id, providerByMeter[price.recurring.meter]])
  )
}

// Starts a Stripe Checkout subscription for every provider price and returns its URL
export async function createCheckoutSession () {
  const { checkout } = getStripe()
  const providerByPrice = await getProviderPrices()
  const order = (priceId) => PROVIDER_IDS.indexOf(providerByPrice[priceId])
  const priceIds = Object.keys(providerByPrice).sort((a, b) => order(a) - order(b))

  if (priceIds.length === 0) throw createError({ statusCode: 500, statusMessage: 'No OAuth prices found in Stripe' })

  // First invoice on the 1st of next month (UTC), so billing periods are calendar months
  const now = new Date()
  const billingCycleAnchor = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000)

  const session = await checkout.sessions.create({
    mode: 'subscription',
    line_items: priceIds.map((price) => ({ price })),
    subscription_data: { billing_cycle_anchor: billingCycleAnchor },
    custom_fields: [
      {
        key: 'service_name',
        label: { type: 'custom', custom: 'Service name (shown to users on login)' },
        type: 'text',
        text: { maximum_length: 60 }
      },
      {
        key: 'redirect_uri',
        label: { type: 'custom', custom: 'OAuth redirect URL' },
        type: 'text',
        text: { maximum_length: 255 }
      }
    ],
    success_url: `${url}/signup?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url}/signup`
  })

  return session.url
}

// Reads a finished Checkout session: status, customer, service name, redirect URL and chosen providers
export async function getCheckoutSession (id) {
  const { checkout } = getStripe()

  const session = await checkout.sessions.retrieve(id, { expand: ['line_items'] })
  const field = (key) => session.custom_fields?.find((f) => f.key === key)?.text?.value?.trim()

  const providerByPrice = await getProviderPrices()
  const providers = (session.line_items?.data ?? [])
    .map((item) => providerByPrice[item.price?.id])
    .filter(Boolean)

  return {
    status: session.status,
    customer: session.customer,
    name: field('service_name') || session.customer_details?.name,
    redirectUri: field('redirect_uri'),
    providers
  }
}

// Reports one authentication to the client's Stripe meter; clients without Stripe are not billed
export async function setBillingUsage (stripeId, provider) {
  if (!stripeId) return

  const { billing } = getStripe()

  return await billing.meterEvents.create({
    event_name: `oauth_${provider}`,
    payload: {
      value: 1,
      stripe_customer_id: stripeId
    }
  })
}

// Counts one authentication start for both billing and statistics
export async function recordUsage (client, provider) {
  await Promise.all([setBillingUsage(client.stripeId, provider), setUsage(client.id, provider)])
}
