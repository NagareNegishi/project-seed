import { describe, expect, it } from "vitest"
import { err, ok, type Result } from "./result"

describe("ok", () => {
  it("wraps a value as a success", () => {
    const r = ok(42)
    expect(r).toEqual({ ok: true, value: 42 })
  })
})

describe("err", () => {
  it("wraps an error as a failure", () => {
    const e = new Error("boom")
    const r = err(e)
    expect(r).toEqual({ ok: false, error: e })
  })
})

describe("Result narrowing", () => {
  it("narrows to value or error on the ok flag", () => {
    const results: Result<number, string>[] = [ok(1), err("bad")]
    const seen: (number | string)[] = results.map((r) =>
      r.ok ? r.value : r.error
    )
    expect(seen).toEqual([1, "bad"])
  })
})
