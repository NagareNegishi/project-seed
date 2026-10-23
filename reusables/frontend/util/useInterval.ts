/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useInterval and useTimeout — declarative setInterval /
 *   setTimeout that clean up automatically.
 * USE WHEN: Polling, tickers, auto-dismiss, delayed effects inside
 *   components — anywhere raw timers would need manual cleanup.
 * NOTES: Pass `null` as the delay to pause. The callback may change
 *   freely; the timer only restarts when the delay changes.
 * ─────────────────────────────────────────────────────────────── */

// Declarative interval and timeout hooks.

import { useEffect, useRef } from "react"

/** Runs `callback` every `delayMs` ms; `null` pauses the interval. */
export function useInterval(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback)
  useEffect(() => { callbackRef.current = callback }, [callback])

  useEffect(() => {
    if (delayMs === null) return
    const id = setInterval(() => callbackRef.current(), delayMs)
    return () => clearInterval(id)
  }, [delayMs])
}

/** Runs `callback` once after `delayMs` ms; `null` cancels/pauses. */
export function useTimeout(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback)
  useEffect(() => { callbackRef.current = callback }, [callback])

  useEffect(() => {
    if (delayMs === null) return
    const id = setTimeout(() => callbackRef.current(), delayMs)
    return () => clearTimeout(id)
  }, [delayMs])
}
