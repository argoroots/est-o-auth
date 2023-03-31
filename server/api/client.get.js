export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  checkRequest(query, null, ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  const client = await getClient(event)
  const usage = await getUsage(client.id)

  return {
    client: client.id,
    description: client.description,
    redirect_uri: true, // client.redirect_uris.includes(query.redirect_uri),
    providers: client.providers,
    usage
  }
})
