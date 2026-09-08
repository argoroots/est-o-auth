// Validates the OAuth query on the server and keeps the client in useState('client'); a failure shows the server's message
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
