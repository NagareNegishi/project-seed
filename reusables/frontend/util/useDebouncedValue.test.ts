import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebouncedValue } from "./useDebouncedValue"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 200))
    expect(result.current).toBe("a")
  })

  it("only takes a new value after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    expect(result.current).toBe("a")

    act(() => vi.advanceTimersByTime(199))
    expect(result.current).toBe("a")

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe("b")
  })

  it("restarts the delay on every change", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    act(() => vi.advanceTimersByTime(150))
    rerender({ value: "c" })
    act(() => vi.advanceTimersByTime(150))
    // 300ms total, but only 150ms since the last change.
    expect(result.current).toBe("a")

    act(() => vi.advanceTimersByTime(50))
    expect(result.current).toBe("c")
  })
})
