import { describe, expect, it } from "vitest"
import { slugify, truncate } from "./stringUtils"

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("strips accents", () => {
    expect(slugify("Crème Brûlée")).toBe("creme-brulee")
  })

  it("collapses runs of punctuation and trims edge hyphens", () => {
    expect(slugify("  --Hello,   World!--  ")).toBe("hello-world")
  })

  it("keeps digits", () => {
    expect(slugify("Top 10 Tips (2026)")).toBe("top-10-tips-2026")
  })

  it("returns an empty string when nothing survives", () => {
    expect(slugify("日本語")).toBe("")
  })
})

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hi", 10)).toBe("hi")
  })

  it("returns text exactly at the limit unchanged", () => {
    expect(truncate("12345", 5)).toBe("12345")
  })

  it("cuts to maxLength including the ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello w…")
  })

  it("does not split emoji", () => {
    // The family emoji is one grapheme built from several code points.
    expect(truncate("👨‍👩‍👧‍👦🎉🎉🎉", 3)).toBe("👨‍👩‍👧‍👦🎉…")
  })

  it("supports a custom ellipsis", () => {
    expect(truncate("hello world", 8, "...")).toBe("hello...")
  })
})
