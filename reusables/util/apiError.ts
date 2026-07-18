/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: The one error shape API endpoints return on failure
 *   (problem-details style: code, message, field errors), plus a
 *   tolerant parser that extracts it from an unknown body.
 * USE WHEN: Defining backend error responses, or reading them on
 *   the frontend — apiFetch's error handling is built on this.
 * NOTES: The parser also accepts legacy shapes (identity-error
 *   arrays, bare string bodies) so older endpoints keep working.
 * ─────────────────────────────────────────────────────────────── */

// Shared API error contract and a tolerant parser for error bodies.

/** Error body endpoints return on failure; mirror this shape server-side. */
export interface ApiErrorBody {
  /** Human-readable summary, safe to display. */
  message: string
  /** Stable machine-readable code, e.g. "validation_failed". */
  code?: string
  /** Validation messages keyed by field name. */
  fieldErrors?: Record<string, string[]>
}

/** Whatever the parser could extract; any field may be absent. */
export type ParsedApiError = Partial<ApiErrorBody>

/**
 * Extracts message/code/fieldErrors from an error body of unknown shape.
 * Understands the ApiErrorBody contract plus legacy shapes: an array of
 * `{ description }` (e.g. ASP.NET Identity errors) and a bare string body.
 * Returns `{}` when nothing usable is found — callers supply the fallback.
 */
export function parseApiErrorBody(body: unknown): ParsedApiError {
  if (typeof body === "string") return body ? { message: body } : {}

  if (Array.isArray(body)) {
    const message = body
      .map((e) => (e as { description?: unknown } | null)?.description)
      .filter((d): d is string => typeof d === "string" && d !== "")
      .join(". ")
    return message ? { message } : {}
  }

  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>
    const parsed: ParsedApiError = {}
    if (typeof b.message === "string" && b.message) parsed.message = b.message
    if (typeof b.code === "string" && b.code) parsed.code = b.code
    const fieldErrors = cleanFieldErrors(b.fieldErrors)
    if (fieldErrors) parsed.fieldErrors = fieldErrors
    return parsed
  }

  return {}
}

// Keeps only string-array entries; drops fields whose messages were all invalid.
function cleanFieldErrors(raw: unknown): Record<string, string[]> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined

  const entries = Object.entries(raw as Record<string, unknown>)
    .map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages.filter((m): m is string => typeof m === "string") : [],
    ] as const)
    .filter(([, messages]) => messages.length > 0)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
