// Runs fn now and again `ms` after each run finishes, so requests never overlap; returns a stop function
export function startPolling (fn, ms) {
  let active = true
  let timer

  // One run, then schedules the next unless stopped meanwhile
  const tick = async () => {
    if (!active) return

    await fn()

    if (active) timer = setTimeout(tick, ms)
  }

  tick()

  return () => {
    active = false
    clearTimeout(timer)
  }
}
