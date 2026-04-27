export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event } = {}) => {
    const path = event?.path || 'unknown'

    if (error?.statusCode >= 400 && error?.statusCode < 500) {
      console.warn(`[warn] ${path}: ${error.statusMessage || error.message}`)
      return
    }

    console.error(`[error] ${path}:`, error)
  })
})
