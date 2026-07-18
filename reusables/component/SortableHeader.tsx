/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: SortableHeader — <th> cell that owns the sort indicator,
 *   aria-sort, and click-to-sort for one column.
 * USE WHEN: Any sortable data table. The table keeps one SortState
 *   and renders a SortableHeader per sortable column.
 * NOTES: Clicking an inactive column sorts ascending; clicking the
 *   active one flips direction. Sorting itself (or the API call)
 *   stays with the table.
 * ─────────────────────────────────────────────────────────────── */

// Sortable table header cell with direction indicator and aria-sort.

import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Which column a table is sorted by, and in which direction. */
export interface SortState<K extends string = string> {
  key: K
  direction: "asc" | "desc"
}

interface SortableHeaderProps<K extends string> {
  /** Column key this header sorts by. */
  sortKey: K
  /** The table's current sort; null when unsorted. */
  sort: SortState<K> | null
  onSortChange: (sort: SortState<K>) => void
  children: ReactNode
  className?: string
}

/** Header cell that reports sort requests for its column via onSortChange. */
export function SortableHeader<K extends string>({
  sortKey,
  sort,
  onSortChange,
  children,
  className,
}: SortableHeaderProps<K>) {
  const active = sort?.key === sortKey
  const direction = active ? sort.direction : null

  const handleClick = () =>
    onSortChange({ key: sortKey, direction: direction === "asc" ? "desc" : "asc" })

  return (
    <th
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}
      className={cn("p-0 text-left", className)}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-1 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        {children}
        {direction === "asc" ? (
          <ArrowUp aria-hidden className="size-4" />
        ) : direction === "desc" ? (
          <ArrowDown aria-hidden className="size-4" />
        ) : (
          <ArrowUpDown aria-hidden className="size-4 text-muted-foreground/60" />
        )}
      </button>
    </th>
  )
}
