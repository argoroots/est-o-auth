export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, null, ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])
  const usage = await getUsage(client.id)

  return {
    client: client.id,
    // Text for the requested UI language, falling back to English, then to whatever language exists
    description: client.description?.[getLang(query.lang)] ?? client.description?.en ?? Object.values(client.description ?? {})[0],
    redirect_uri: true, // client.redirect_uris.includes(query.redirect_uri),
    providers: client.providers,
    usage
  }
})
