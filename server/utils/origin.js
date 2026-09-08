// Origin of this deployment: from config in production (a spoofed Host must not change signed data), from the request in dev
export function getOrigin (event) {
  if (import.meta.dev) return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin

  return new URL(useRuntimeConfig().url).origin
}
