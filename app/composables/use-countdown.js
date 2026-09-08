// Seconds counting down to zero once per second; used to block resending a code during the server cooldown
export function useCountdown () {
  const seconds = ref(0)
  let interval

  // Starts (or restarts) the countdown from the given number of seconds
  function start (from) {
    seconds.value = from
    clearInterval(interval)
    interval = setInterval(() => {
      seconds.value -= 1

      if (seconds.value <= 0) clearInterval(interval)
    }, 1000)
  }

  onUnmounted(() => clearInterval(interval))

  return { seconds, start }
}
