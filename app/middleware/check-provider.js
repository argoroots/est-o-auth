// After check-query on /auth/<provider>: the provider in the path must be enabled for the client
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
