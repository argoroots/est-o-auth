// Client details for the auth pages: id, description in the UI language and enabled providers
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = await validateRequest(query, null, ['client_id', 'redirect_uri', 'response_type', 'scope', 'state'])

  return {
    client: client.id,
    // Requested UI language, then English, then whatever language exists
    description: client.description?.[getLang(query.lang)] ?? client.description?.en ?? Object.values(client.description ?? {})[0],
    redirect_uri: true, // client.redirect_uris.includes(query.redirect_uri),
    providers: client.providers
  }
})
