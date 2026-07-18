/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: debounce (run once after calls stop) and throttle (run at
 *   most once per interval) for plain functions.
 * USE WHEN: Rate-limiting handlers outside React — scroll, resize,
 *   window events, Node scripts. Inside React components, prefer
 *   the useDebouncedValue hook for input state.
 * NOTES: Both return a wrapper with a .cancel() method; call it on
 *   teardown to drop a pending trailing run.
 * ─────────────────────────────────────────────────────────────── */

// Plain-function debounce and throttle with cancel handles.

/** Debounced `fn`: runs `wait` ms after the last call; later calls reset the timer. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: A) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
  debounced.cancel = () => clearTimeout(timer)

  return debounced
}

/** Throttled `fn`: runs immediately, then at most once per `wait` ms with the latest args. */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let lastRun = -Infinity
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArgs: A

  const throttled = (...args: A) => {
    pendingArgs = args
    const remaining = lastRun + wait - Date.now()
    if (remaining <= 0) {
      lastRun = Date.now()
      fn(...args)
    } else if (!timer) {
      // Trailing call: fire once when the current window closes, with the newest args.
      timer = setTimeout(() => {
        timer = undefined
        lastRun = Date.now()
        fn(...pendingArgs)
      }, remaining)
    }
  }
  throttled.cancel = () => {
    clearTimeout(timer)
    timer = undefined
  }

  return throttled
}
