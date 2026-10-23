import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useMediaQuery } from "./useMediaQuery"

// jsdom has no matchMedia; fake one per query with a controllable match state.
function installMatchMedia(initial: boolean) {
  let listeners: Array<(e: { matches: boolean }) => void> = []
  const mql = {
    matches: initial,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners = listeners.filter((l) => l !== cb)
    },
  }
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql))
  return {
    setMatches(matches: boolean) {
      mql.matches = matches
      listeners.forEach((l) => l({ matches }))
    },
    listenerCount: () => listeners.length,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("useMediaQuery", () => {
  it("reports the initial match state", () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"))
    expect(result.current).toBe(true)
  })

  it("updates when the query starts and stops matching", () => {
    const media = installMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"))
    expect(result.current).toBe(false)

    act(() => media.setMatches(true))
    expect(result.current).toBe(true)

    act(() => media.setMatches(false))
    expect(result.current).toBe(false)
  })

  it("removes its listener on unmount", () => {
    const media = installMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"))
    expect(media.listenerCount()).toBe(1)

    unmount()
    expect(media.listenerCount()).toBe(0)
  })
})
