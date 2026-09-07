// Origin of this deployment, e.g. https://oauth.ee. Taken from configuration in production so a
// spoofed Host header cannot change it (it is part of the Web eID signed data and the Smart-ID
// callback URL); taken from the request in development so localhost works without config changes.
export function getOrigin (event) {
  if (import.meta.dev) return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin

  return new URL(useRuntimeConfig().url).origin
}
