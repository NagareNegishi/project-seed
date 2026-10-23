import { describe, expect, it } from "vitest"
import { hasNextPage, hasPrevPage, pageCount, type PagedResult } from "./pagedResult"

function paged(page: number, total: number, size: number): PagedResult<number> {
  return { items: [], total, page, size }
}

describe("pageCount", () => {
  it("divides evenly", () => {
    expect(pageCount(10, 5)).toBe(2)
  })

  it("rounds a partial last page up", () => {
    expect(pageCount(11, 5)).toBe(3)
  })

  it("reports one page for an empty list", () => {
    expect(pageCount(0, 5)).toBe(1)
  })

  it("reports one page when everything fits", () => {
    expect(pageCount(3, 5)).toBe(1)
  })
})

describe("hasPrevPage / hasNextPage", () => {
  it("first page has next but no prev", () => {
    const p = paged(1, 11, 5)
    expect(hasPrevPage(p)).toBe(false)
    expect(hasNextPage(p)).toBe(true)
  })

  it("middle page has both", () => {
    const p = paged(2, 11, 5)
    expect(hasPrevPage(p)).toBe(true)
    expect(hasNextPage(p)).toBe(true)
  })

  it("last page has prev but no next", () => {
    const p = paged(3, 11, 5)
    expect(hasPrevPage(p)).toBe(true)
    expect(hasNextPage(p)).toBe(false)
  })

  it("single empty page has neither", () => {
    const p = paged(1, 0, 5)
    expect(hasPrevPage(p)).toBe(false)
    expect(hasNextPage(p)).toBe(false)
  })
})
