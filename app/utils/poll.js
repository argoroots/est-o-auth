// Runs fn immediately and then again `ms` after each run finishes, so a slow request never overlaps
// the next one (setInterval would fire regardless). Returns a function that stops the loop.
export function startPolling (fn, ms) {
  let active = true
  let timer

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
