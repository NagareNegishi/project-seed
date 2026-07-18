import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { debounce, throttle } from "./debounce"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("debounce", () => {
  it("runs once with the last args after calls stop", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d("a")
    d("b")
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledExactlyOnceWith("b")
  })

  it("resets the timer on each call", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d()
    vi.advanceTimersByTime(60)
    d()
    vi.advanceTimersByTime(60)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(40)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("cancel drops the pending run", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d()
    d.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
  })
})

describe("throttle", () => {
  it("runs immediately on the first call", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100)
    t("a")
    expect(fn).toHaveBeenCalledExactlyOnceWith("a")
  })

  it("collapses calls inside the window into one trailing run with latest args", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100)
    t("a")
    t("b")
    t("c")
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith("c")
  })

  it("allows a new immediate run after the window passes", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100)
    t("a")
    vi.advanceTimersByTime(150)
    t("b")
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith("b")
  })

  it("cancel drops the pending trailing run", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100)
    t("a")
    t("b")
    t.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
