/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: Result<T, E> — a return value that is explicitly either a
 *   success holding a value or a failure holding a typed error.
 * USE WHEN: A function can fail in expected, recoverable ways
 *   (parsing, validation, lookups) and you want callers to handle
 *   both outcomes without try/catch.
 * NOTES: Not for bugs or truly unexpected errors — let those throw.
 * ─────────────────────────────────────────────────────────────── */

// Minimal Result type: success or typed failure, no exceptions.

/** Either `{ ok: true, value }` or `{ ok: false, error }`; narrow on `ok`. */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

/** Wraps a value in a success Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/** Wraps an error in a failure Result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
