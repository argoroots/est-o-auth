// Calls an SK (Smart-ID / Mobile-ID) endpoint; SK's 4xx becomes our 400 with its message, anything else 502
export async function skFetch (url, options) {
  try {
    return await $fetch(url, options)
  }
  catch (error) {
    // Smart-ID v3 errors are RFC 9457 problem details, Mobile-ID uses { error }
    const message = error.data?.detail || error.data?.title || error.data?.error || error.message
    const status = error.statusCode >= 400 && error.statusCode < 500 ? 400 : 502

    throw createError({ statusCode: status, statusMessage: message || 'SK request failed' })
  }
}
