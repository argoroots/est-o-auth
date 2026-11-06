// Usage counters for a client; public by decision and apart from /api/client so the login flow never pays for it
// Without month: the last 12 months; with month=YYYY-MM: every day of that month
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (query.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) throw apiError(400, 'invalid.month')

  const client = await validateRequest(query, null, ['client_id'])

  return {
    client: client.id,
    usage: await getUsage(client.id, query.month)
  }
})
