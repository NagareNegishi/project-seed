import { describe, expect, it } from "vitest"
import { safeJsonParse, safeJsonParseOr } from "./safeJsonParse"

describe("safeJsonParse", () => {
  it("returns ok with the parsed value on valid JSON", () => {
    const r = safeJsonParse<{ a: number }>('{"a": 1}')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ a: 1 })
  })

  it("parses JSON scalars, not just objects", () => {
    expect(safeJsonParse("true")).toEqual({ ok: true, value: true })
    expect(safeJsonParse("null")).toEqual({ ok: true, value: null })
  })

  it("returns err with a SyntaxError on invalid JSON", () => {
    const r = safeJsonParse("{nope")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBeInstanceOf(SyntaxError)
  })
})

describe("safeJsonParseOr", () => {
  it("returns the parsed value on valid JSON", () => {
    expect(safeJsonParseOr("[1,2]", [])).toEqual([1, 2])
  })

  it("returns the fallback on invalid JSON", () => {
    expect(safeJsonParseOr("not json", { a: 0 })).toEqual({ a: 0 })
  })
})
