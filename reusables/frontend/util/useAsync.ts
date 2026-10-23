/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useAsync — run an async function from a component and get
 *   loading state plus a Result (success value or error) back.
 * USE WHEN: Fetching or mutating on user action (submit, click)
 *   without hand-rolling loading/error/data useState triples.
 * NOTES: Only the latest run updates state — stale responses are
 *   dropped. Not a cache; reach for a query library when you need
 *   caching, refetching, or invalidation.
 * ─────────────────────────────────────────────────────────────── */

// Async-call state hook built on the Result type.

import { useCallback, useEffect, useRef, useState } from "react"
import { err, ok, type Result } from "./result"

/**
 * Wraps an async function with loading state and a Result of the last run.
 * `run` never throws: rejections come back as `{ ok: false, error }`.
 */
export function useAsync<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result<T, Error> | null>(null)

  // Latest fn without making `run` a new function every render.
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])

  // Each run takes a new id; a settle only updates state if it is still the
  // latest run. Bumped on reset/unmount so stale settles are dropped too.
  const runIdRef = useRef(0)
  useEffect(() => () => { runIdRef.current++ }, [])

  /** Runs the function; resolves with the same Result that lands in state. */
  const run = useCallback(async (...args: Args): Promise<Result<T, Error>> => {
    const id = ++runIdRef.current
    setLoading(true)

    let r: Result<T, Error>
    try {
      r = ok(await fnRef.current(...args))
    } catch (e) {
      r = err(e instanceof Error ? e : new Error(String(e)))
    }

    if (id === runIdRef.current) {
      setResult(r)
      setLoading(false)
    }
    return r
  }, [])

  /** Clears loading and result, and detaches any in-flight run. */
  const reset = useCallback(() => {
    runIdRef.current++
    setLoading(false)
    setResult(null)
  }, [])

  return { loading, result, run, reset }
}
