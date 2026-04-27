import Stripe from 'stripe'

const { stripeKey } = useRuntimeConfig()

export async function setBillingUsage (stripeId, provider) {
  if (!stripeId) return

  const { billing } = new Stripe(stripeKey)

  return await billing.meterEvents.create({
    event_name: `oauth_${provider}`,
    payload: {
      value: 1,
      stripe_customer_id: stripeId
    }
  })
}
