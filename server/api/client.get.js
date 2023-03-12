export default defineEventHandler(async (event) => {
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
