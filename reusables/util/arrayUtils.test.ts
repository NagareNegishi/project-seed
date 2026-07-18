import { describe, expect, it } from "vitest"
import { chunk, groupBy, uniqueBy } from "./arrayUtils"

describe("groupBy", () => {
  it("groups items by key, preserving order within groups", () => {
    const items = [
      { type: "a", n: 1 },
      { type: "b", n: 2 },
      { type: "a", n: 3 },
    ]
    const groups = groupBy(items, (i) => i.type)
    expect(groups.get("a")).toEqual([items[0], items[2]])
    expect(groups.get("b")).toEqual([items[1]])
  })

  it("returns an empty map for an empty array", () => {
    expect(groupBy([], () => "x").size).toBe(0)
  })
})

describe("chunk", () => {
  it("splits into equal chunks with a shorter final one", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it("returns one chunk when size exceeds length", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]])
  })

  it("returns an empty array for empty input", () => {
    expect(chunk([], 3)).toEqual([])
  })

  it("throws on a non-positive or fractional size", () => {
    expect(() => chunk([1], 0)).toThrow(RangeError)
    expect(() => chunk([1], -1)).toThrow(RangeError)
    expect(() => chunk([1], 1.5)).toThrow(RangeError)
  })
})

describe("uniqueBy", () => {
  it("keeps the first occurrence of each key", () => {
    const items = [
      { id: 1, v: "first" },
      { id: 2, v: "second" },
      { id: 1, v: "dup" },
    ]
    expect(uniqueBy(items, (i) => i.id)).toEqual([items[0], items[1]])
  })

  it("returns an empty array for empty input", () => {
    expect(uniqueBy([], (i) => i)).toEqual([])
  })
})
