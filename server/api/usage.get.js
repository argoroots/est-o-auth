// Usage counters for a client; public by decision and apart from /api/client so the login flow never pays for it
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, null, ['client_id'])

  return {
    client: client.id,
    usage: await getUsage(client.id)
  }
})
