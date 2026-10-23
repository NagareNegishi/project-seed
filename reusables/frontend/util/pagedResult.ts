/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: PagedResult<T> — the pagination envelope (items, total,
 *   page, size) shared between frontend and backend, plus small
 *   paging-math helpers.
 * USE WHEN: Any endpoint that returns one page of a larger list;
 *   PaginationBar consumes it. Mirror the shape server-side.
 * NOTES: `page` is 1-based. An empty list still counts as one page.
 * ─────────────────────────────────────────────────────────────── */

// Pagination envelope type and paging-math helpers.

/** One page of a larger list, as returned by a paged endpoint. */
export interface PagedResult<T> {
  items: T[]
  /** Total items across all pages, not just this one. */
  total: number
  /** 1-based page number. */
  page: number
  /** Requested page size; the last page may hold fewer items. */
  size: number
}

/** Number of pages for `total` items at `size` per page; at least 1, so an empty list still renders page 1 of 1. */
export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size))
}

/** True when a page exists before the current one. */
export function hasPrevPage(paged: PagedResult<unknown>): boolean {
  return paged.page > 1
}

/** True when a page exists after the current one. */
export function hasNextPage(paged: PagedResult<unknown>): boolean {
  return paged.page < pageCount(paged.total, paged.size)
}
