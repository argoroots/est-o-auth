// Usage counters for a client. Public by decision (statistics), needs only the client id, and lives
// apart from /api/client so the login flow does not pay for the batch read on every page.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, null, ['client_id'])

  return {
    client: client.id,
    usage: await getUsage(client.id)
  }
})
