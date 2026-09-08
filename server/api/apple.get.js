// Starts an Apple login: returns the Sign in with Apple URL carrying our signed state
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, 'apple', ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  await checkUsageLimit(client.id, 'apple')

  const config = useRuntimeConfig()

  const search = new URLSearchParams({
    client_id: config.appleId,
    redirect_uri: `${config.url}/api/apple`,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'email name',
    state: signProviderState(client, query)
  })

  await recordUsage(client, 'apple')

  return { url: `https://appleid.apple.com/auth/authorize?${search}` }
})
