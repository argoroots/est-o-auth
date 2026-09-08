// Path without query, provider from the path, client id from query or body, and method of a failed request
async function requestContext (event) {
  const path = event?.path?.split('?')[0] ?? 'unknown'
  const provider = PROVIDER_IDS.find((p) => path.startsWith(`/api/${p}`) || path.startsWith(`/auth/${p}`))

  let clientId = getQuery(event)?.client_id

  if (!clientId && event?.method !== 'GET') {
    try {
      clientId = (await readBody(event))?.client_id
    }
    catch {
      // body not readable or not JSON; leave client id unknown
    }
  }

  return { path, provider, clientId, method: event?.method ?? '-' }
}

// Logs every request failure as one line; 4xx as warnings, 5xx with the stack, never the whole error (bodies hold ID codes)
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event } = {}) => {
    const { path, provider, clientId, method } = await requestContext(event)
    const status = error?.statusCode ?? 500
    const context = [clientId && `client=${logSafe(clientId)}`, provider && `provider=${provider}`].filter(Boolean).join(' ')
    const line = `${status} ${method} ${logSafe(path)}${context ? ` ${context}` : ''}: ${logSafe(error?.statusMessage || error?.message)}`

    if (status >= 400 && status < 500) {
      console.warn(`[warn] ${line}`)
      return
    }

    console.error(`[error] ${line}\n${error?.stack ?? ''}`)
  })
})
