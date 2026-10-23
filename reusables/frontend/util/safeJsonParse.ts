/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: JSON.parse that returns a Result instead of throwing.
 * USE WHEN: Parsing anything you don't control — localStorage,
 *   API responses, user-supplied files. Use safeJsonParseOr when a
 *   fallback value is all you need.
 * NOTES: The type parameter is a claim, not a check — the parsed
 *   shape is not validated against T.
 * ─────────────────────────────────────────────────────────────── */

// No-throw JSON parsing built on the Result type.

import { err, ok, type Result } from "./result"

/** Parses JSON into a Result; `T` is asserted, not validated. */
export function safeJsonParse<T = unknown>(text: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(text) as T)
  } catch (e) {
    return err(e as SyntaxError)
  }
}

/** Parses JSON, returning `fallback` when the input is invalid. */
export function safeJsonParseOr<T>(text: string, fallback: T): T {
  const result = safeJsonParse<T>(text)
  return result.ok ? result.value : fallback
}
