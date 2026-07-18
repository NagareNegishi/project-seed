import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { PagedResult } from "@/utils/pagedResult"
import { getPageItems, PaginationBar } from "./PaginationBar"

/** PagedResult with `size` 10, so total 100 gives 10 pages. */
function paged(page: number, total = 100): PagedResult<unknown> {
  return { items: [], total, page, size: 10 }
}

describe("getPageItems", () => {
  it("lists every page when they all fit", () => {
    expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("elides the right side near the start", () => {
    expect(getPageItems(2, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
  })

  it("elides both sides in the middle", () => {
    expect(getPageItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
  })

  it("elides the left side near the end", () => {
    expect(getPageItems(9, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
  })

  it("keeps a constant item count across all pages", () => {
    const counts = new Set(range10().map(p => getPageItems(p, 10).length))
    expect(counts.size).toBe(1)
  })

  it("widens the window with siblingCount", () => {
    expect(getPageItems(10, 20, 2)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20])
  })
})

function range10(): number[] {
  return Array.from({ length: 10 }, (_, i) => i + 1)
}

describe("PaginationBar", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<PaginationBar paged={paged(1, 5)} onPageChange={() => {}} />)
    expect(container.innerHTML).toBe("")
  })

  it("marks the current page and fires onPageChange for others", () => {
    const onPageChange = vi.fn()
    render(<PaginationBar paged={paged(5)} onPageChange={onPageChange} />)

    expect(screen.getByRole("button", { name: "Page 5" }).getAttribute("aria-current")).toBe("page")

    fireEvent.click(screen.getByRole("button", { name: "Page 6" }))
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(6)
  })

  it("disables prev on the first page and next on the last", () => {
    const { rerender } = render(<PaginationBar paged={paged(1)} onPageChange={() => {}} />)
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Previous page" }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next page" }).disabled).toBe(false)

    rerender(<PaginationBar paged={paged(10)} onPageChange={() => {}} />)
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next page" }).disabled).toBe(true)
  })

  it("steps a page with prev/next", () => {
    const onPageChange = vi.fn()
    render(<PaginationBar paged={paged(5)} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }))
    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(onPageChange.mock.calls).toEqual([[4], [6]])
  })
})
