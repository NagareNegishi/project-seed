import { describe, expect, it } from "vitest"
import { formatBytes, formatCompact, formatCurrency, formatNumber } from "./formatNumber"

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.891")
  })

  it("respects the locale", () => {
    expect(formatNumber(1234.5, "de")).toBe("1.234,5")
  })
})

describe("formatCurrency", () => {
  it("shows symbol and two decimals for USD", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50")
  })

  it("uses the currency's own decimal rules", () => {
    // JPY has no minor unit, so no decimals appear.
    expect(formatCurrency(1234, "JPY")).toBe("¥1,234")
  })
})

describe("formatCompact", () => {
  it("leaves small numbers alone", () => {
    expect(formatCompact(999)).toBe("999")
  })

  it("abbreviates thousands", () => {
    expect(formatCompact(1234)).toBe("1.2K")
  })

  it("abbreviates millions", () => {
    expect(formatCompact(1500000)).toBe("1.5M")
  })
})

describe("formatBytes", () => {
  it("keeps small counts in bytes", () => {
    expect(formatBytes(0)).toBe("0 byte")
    expect(formatBytes(512)).toBe("512 byte")
  })

  it("scales by 1024", () => {
    expect(formatBytes(1536)).toBe("1.5 kB")
    expect(formatBytes(2 * 1024 ** 2)).toBe("2 MB")
    expect(formatBytes(3 * 1024 ** 3)).toBe("3 GB")
  })

  it("caps at the largest unit", () => {
    expect(formatBytes(1024 ** 6)).toBe("1,024 PB")
  })
})
