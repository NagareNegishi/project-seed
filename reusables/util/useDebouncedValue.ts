/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useDebouncedValue — a copy of a value that only updates
 *   after the source has stopped changing for `delayMs`.
 * USE WHEN: Search-as-you-type, filtering, or anything that should
 *   react to typing pauses instead of every keystroke.
 * NOTES: Debounces a value, not a function — for callbacks use
 *   debounce from debounce.ts.
 * ─────────────────────────────────────────────────────────────── */

// Debounced-value hook.

import { useEffect, useState } from "react"

/** Returns `value`, but trailing changes by `delayMs` of quiet time. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
