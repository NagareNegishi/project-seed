/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: retry(fn) — reruns a failing async function with
 *   exponential backoff. Also exports the sleep(ms) it is built on.
 * USE WHEN: Transient failures worth retrying: flaky network calls,
 *   rate-limited APIs, scripts hitting eventually-consistent state.
 * NOTES: Retries every error by default — pass shouldRetry to stop
 *   early on permanent failures (e.g. HTTP 4xx).
 * ─────────────────────────────────────────────────────────────── */

// Async retry with exponential backoff.

/** Resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface RetryOptions {
  /** Extra attempts after the first failure. Default 3. */
  retries?: number
  /** Delay before the first retry, doubling each attempt. Default 250. */
  baseDelayMs?: number
  /** Upper bound on any single delay. Default 10000. */
  maxDelayMs?: number
  /** Return false to give up immediately; `attempt` starts at 0. Default: always retry. */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

/** Runs `fn`, retrying failures with exponentially growing delays; rethrows the last error. */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 250,
    maxDelayMs = 10_000,
    shouldRetry = () => true,
  } = options

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt)) throw error
      await sleep(Math.min(baseDelayMs * 2 ** attempt, maxDelayMs))
    }
  }
}
