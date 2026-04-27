export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event } = {}) => {
    const path = event?.path || 'unknown'
    console.error(`[error] ${path}:`, error)
  })
})
