import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useCopyToClipboard } from "./useCopyToClipboard"

// jsdom has no navigator.clipboard; install a stub per test.
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("useCopyToClipboard", () => {
  it("copies text and raises the copied flag", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    const { result } = renderHook(() => useCopyToClipboard())

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.copy("hello") })

    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
    expect(result.current.copied).toBe(true)
  })

  it("drops the copied flag after resetAfterMs", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    const { result } = renderHook(() => useCopyToClipboard(1000))

    await act(async () => { await result.current.copy("x") })
    expect(result.current.copied).toBe(true)

    act(() => vi.advanceTimersByTime(999))
    expect(result.current.copied).toBe(true)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.copied).toBe(false)
  })

  it("restarts the reset timer on rapid copies", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    const { result } = renderHook(() => useCopyToClipboard(1000))

    await act(async () => { await result.current.copy("a") })
    act(() => vi.advanceTimersByTime(600))
    await act(async () => { await result.current.copy("b") })
    act(() => vi.advanceTimersByTime(600))
    // 1200ms after the first copy, but only 600ms after the second.
    expect(result.current.copied).toBe(true)

    act(() => vi.advanceTimersByTime(400))
    expect(result.current.copied).toBe(false)
  })

  it("resolves false and stays uncopied when the browser refuses", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    const { result } = renderHook(() => useCopyToClipboard())

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.copy("nope") })

    expect(ok).toBe(false)
    expect(result.current.copied).toBe(false)
  })
})
