// Validates the OAuth query and loads the client once per navigation. The server checks the
// parameters and the client id; its message is shown as-is so a failure explains itself.
// The client is kept in useState('client') for the page.
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useState('client')

  try {
    client.value = await $fetch('/api/client', { query: to.query })
  }
  catch (error) {
    client.value = null

    return showError({
      statusCode: error.statusCode || 502,
      statusMessage: error.data?.statusMessage || error.statusMessage || 'Could not verify client'
    })
  }
})
