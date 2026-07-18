import { describe, expect, it } from "vitest"
import { relativeTime } from "./relativeTime"

// Fixed reference point so results don't depend on when the test runs.
const now = new Date("2026-07-18T12:00:00Z")
const at = (iso: string) => relativeTime(new Date(iso), { now })

describe("relativeTime", () => {
  it("says now for the reference moment itself", () => {
    expect(at("2026-07-18T12:00:00Z")).toBe("now")
  })

  it("uses seconds under a minute", () => {
    expect(at("2026-07-18T11:59:15Z")).toBe("45 seconds ago")
  })

  it("uses minutes under an hour", () => {
    expect(at("2026-07-18T11:55:00Z")).toBe("5 minutes ago")
  })

  it("uses hours under a day", () => {
    expect(at("2026-07-18T15:00:00Z")).toBe("in 3 hours")
  })

  it("prefers wording like yesterday when numeric would be 1", () => {
    expect(at("2026-07-17T11:00:00Z")).toBe("yesterday")
  })

  it("uses days under a week", () => {
    expect(at("2026-07-15T12:00:00Z")).toBe("3 days ago")
  })

  it("uses weeks under a month", () => {
    expect(at("2026-07-04T12:00:00Z")).toBe("2 weeks ago")
  })

  it("uses months under a year", () => {
    expect(at("2026-04-18T12:00:00Z")).toBe("3 months ago")
  })

  it("uses years beyond that", () => {
    expect(at("2024-07-18T12:00:00Z")).toBe("2 years ago")
  })

  it("accepts timestamps and ISO strings", () => {
    expect(relativeTime(now.getTime() - 60_000, { now })).toBe("1 minute ago")
    expect(relativeTime("2026-07-18T11:00:00Z", { now })).toBe("1 hour ago")
  })
})
