export default defineNuxtRouteMiddleware(async (to) => {
  const { query } = to

  if (!query.client_id) {
    return showError({
      statusCode: 400,
      statusMessage: 'Required parameter client_id is missing!'
    })
  }

  if (!query.redirect_uri) {
    return showError({
      statusCode: 400,
      statusMessage: 'Required parameter redirect_uri is missing!'
    })
  }

  if (!query.state) {
    return showError({
      statusCode: 400,
      statusMessage: 'Required parameter state is missing!'
    })
  }

  if (query.response_type !== 'code') {
    return showError({
      statusCode: 400,
      statusMessage: 'The response_type in the request do not match required value "code"!'
    })
  }

  if (query.scope !== 'openid') {
    return showError({
      statusCode: 400,
      statusMessage: 'The scope in the request do not match required value "openid"!'
    })
  }

  const { data: client } = await useFetch('/api/client', { query })

  if (!client.value) {
    return showError({
      statusCode: 400,
      statusMessage: 'The client ID (client_id) in the request do not match a registered client ID!'
    })
  }

  if (!client.value.redirect_uri) {
    return showError({
      statusCode: 400,
      statusMessage: 'The redirect URI (redirect_uri) in the request do not match a registered redirect URI!'
    })
  }
})
