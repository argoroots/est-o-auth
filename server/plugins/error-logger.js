// Logs request failures as one line each: status, method, path (without query), client id and
// provider when known, then the message. 4xx are warnings (client mistakes, limits, abuse); 5xx get
// the stack. Never the whole error object: ofetch errors embed request and response bodies, which for
// SK calls contain ID codes and phone numbers.
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

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event } = {}) => {
    const { path, provider, clientId, method } = await requestContext(event)
    const status = error?.statusCode ?? 500
    // Client id comes from the request and the message may echo provider responses: neither is trusted
    const context = [clientId && `client=${logSafe(clientId)}`, provider && `provider=${provider}`].filter(Boolean).join(' ')
    const line = `${status} ${method} ${logSafe(path)}${context ? ` ${context}` : ''}: ${logSafe(error?.statusMessage || error?.message)}`

    if (status >= 400 && status < 500) {
      console.warn(`[warn] ${line}`)
      return
    }

    console.error(`[error] ${line}\n${error?.stack ?? ''}`)
  })
})
