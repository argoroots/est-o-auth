export default defineEventHandler(async (event) => {
  const client = await getClient(event)

  if (!client) throw createError({ statusCode: 404, statusMessage: 'Client not found!' })

  const usage = {} // await storage.getUsage(query.client_id)

  return {
    client: client.id,
    description: client.description,
    redirect_uri: true, // client.redirect_uris.includes(query.redirect_uri),
    providers: client.providers,
    usage
  }
})
