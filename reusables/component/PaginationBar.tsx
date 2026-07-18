/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: PaginationBar — prev/next + page numbers with ellipsis for
 *   a PagedResult. getPageItems holds the windowing logic.
 * USE WHEN: Under any paged list or table backed by a PagedResult
 *   endpoint. Renders nothing when there is only one page.
 * NOTES: Only total/page/size are read from `paged`. Without a
 *   PagedResult, pass `{ items: [], total, page, size }`.
 * ─────────────────────────────────────────────────────────────── */

// Pagination bar for PagedResult, plus the page-window helper.

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { hasNextPage, hasPrevPage, pageCount, type PagedResult } from "@/utils/pagedResult"

export type PageItem = number | "ellipsis"

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * Pages to render: first and last always visible, `siblingCount` pages on
 * each side of the current one, ellipsis where pages are skipped. The window
 * keeps a constant width so the bar never jumps as the page changes.
 */
export function getPageItems(page: number, pages: number, siblingCount = 1): PageItem[] {
  // Small enough that every page fits without ellipsis.
  if (pages <= 2 * siblingCount + 5) return range(1, pages)

  const showLeftEllipsis = page - siblingCount > 2
  const showRightEllipsis = page + siblingCount < pages - 1

  if (!showLeftEllipsis) {
    return [...range(1, 2 * siblingCount + 3), "ellipsis", pages]
  }
  if (!showRightEllipsis) {
    return [1, "ellipsis", ...range(pages - 2 * siblingCount - 2, pages)]
  }
  return [1, "ellipsis", ...range(page - siblingCount, page + siblingCount), "ellipsis", pages]
}

interface PaginationBarProps {
  /** The page envelope this bar navigates; only total/page/size are read. */
  paged: PagedResult<unknown>
  onPageChange: (page: number) => void
  /** Pages shown on each side of the current page. */
  siblingCount?: number
  className?: string
}

/** Prev/next and windowed page-number buttons for a PagedResult. */
export function PaginationBar({ paged, onPageChange, siblingCount = 1, className }: PaginationBarProps) {
  const pages = pageCount(paged.total, paged.size)
  if (pages <= 1) return null

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={!hasPrevPage(paged)}
        onClick={() => onPageChange(paged.page - 1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      {getPageItems(paged.page, pages, siblingCount).map((item, i) =>
        item === "ellipsis" ? (
          // Position as key: the two ellipses are stable slots in the window.
          <span key={`e${i}`} aria-hidden className="px-1 text-muted-foreground">
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === paged.page ? "outline" : "ghost"}
            size="icon-sm"
            aria-label={`Page ${item}`}
            aria-current={item === paged.page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        )
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={!hasNextPage(paged)}
        onClick={() => onPageChange(paged.page + 1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  )
}
