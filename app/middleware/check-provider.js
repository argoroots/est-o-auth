// Runs after check-query on /auth/<provider> pages: the provider in the path must be one the
// client has enabled, otherwise the page would start a request the server rejects anyway.
export default defineNuxtRouteMiddleware((to) => {
  const client = useState('client')
  const provider = to.path.split('/').pop()

  if (!client.value?.providers?.includes(provider)) {
    return showError({
      statusCode: 400,
      statusMessage: `The authentication provider "${provider}" is not enabled for this client`
    })
  }
})
