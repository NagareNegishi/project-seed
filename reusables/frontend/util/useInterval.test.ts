import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useInterval, useTimeout } from "./useInterval"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("useInterval", () => {
  it("fires repeatedly at the given delay", () => {
    const callback = vi.fn()
    renderHook(() => useInterval(callback, 100))

    act(() => vi.advanceTimersByTime(350))
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it("pauses when the delay is null", () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ delay }: { delay: number | null }) => useInterval(callback, delay),
      { initialProps: { delay: 100 as number | null } }
    )

    act(() => vi.advanceTimersByTime(100))
    expect(callback).toHaveBeenCalledTimes(1)

    rerender({ delay: null })
    act(() => vi.advanceTimersByTime(500))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("always calls the latest callback", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 100),
      { initialProps: { cb: first } }
    )

    rerender({ cb: second })
    act(() => vi.advanceTimersByTime(100))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("stops on unmount", () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useInterval(callback, 100))

    unmount()
    act(() => vi.advanceTimersByTime(300))
    expect(callback).not.toHaveBeenCalled()
  })
})

describe("useTimeout", () => {
  it("fires once after the delay", () => {
    const callback = vi.fn()
    renderHook(() => useTimeout(callback, 100))

    act(() => vi.advanceTimersByTime(99))
    expect(callback).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(500))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("cancels when the delay becomes null before firing", () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ delay }: { delay: number | null }) => useTimeout(callback, delay),
      { initialProps: { delay: 100 as number | null } }
    )

    act(() => vi.advanceTimersByTime(50))
    rerender({ delay: null })
    act(() => vi.advanceTimersByTime(500))
    expect(callback).not.toHaveBeenCalled()
  })

  it("cancels on unmount", () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useTimeout(callback, 100))

    unmount()
    act(() => vi.advanceTimersByTime(300))
    expect(callback).not.toHaveBeenCalled()
  })
})
