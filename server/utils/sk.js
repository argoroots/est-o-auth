// Calls an SK (Smart-ID / Mobile-ID) API endpoint. SK answers client mistakes such as an unknown
// phone number or a malformed request with 4xx and a message; ofetch throws on those, so without this
// they would surface as our 500. Smart-ID v3 errors are RFC 9457 problem details, Mobile-ID uses { error }.
export async function skFetch (url, options) {
  try {
    return await $fetch(url, options)
  }
  catch (error) {
    const message = error.data?.detail || error.data?.title || error.data?.error || error.message
    const status = error.statusCode >= 400 && error.statusCode < 500 ? 400 : 502

    throw createError({ statusCode: status, statusMessage: message || 'SK request failed' })
  }
}
