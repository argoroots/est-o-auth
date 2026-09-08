// API error whose statusMessage is a key from the locale `errors` section; the browser translates it, the log prints it
export function apiError (statusCode, key) {
  return createError({ statusCode, statusMessage: key })
}

// Authentication failure reported as 400 with a key
export function authError (key) {
  return apiError(400, key)
}

// Error for a missing request parameter, e.g. client_id -> missing.clientId
export function missingParamError (name) {
  return apiError(400, `missing.${name.replace(/_(\w)/g, (_, c) => c.toUpperCase())}`)
}
