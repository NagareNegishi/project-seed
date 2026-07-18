/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: The three array helpers otherwise imported from lodash:
 *   groupBy, chunk, uniqueBy.
 * USE WHEN: Grouping rows for display, batching items for API
 *   calls, deduplicating fetched lists by id.
 * NOTES: All are non-mutating and preserve input order.
 * ─────────────────────────────────────────────────────────────── */

// groupBy, chunk, and uniqueBy without a library.

/** Groups items into a Map keyed by `getKey`, preserving order within each group. */
export function groupBy<T, K>(items: readonly T[], getKey: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const key = getKey(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return groups
}

/** Splits items into consecutive chunks of `size`; the last chunk may be shorter. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`)
  }
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/** Removes duplicates by `getKey`, keeping the first occurrence of each key. */
export function uniqueBy<T, K>(items: readonly T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>()
  const unique: T[] = []
  for (const item of items) {
    const key = getKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }
  return unique
}
