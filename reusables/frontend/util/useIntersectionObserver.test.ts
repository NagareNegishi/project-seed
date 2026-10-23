import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useIntersectionObserver } from "./useIntersectionObserver"

// jsdom has no IntersectionObserver; capture instances so tests can fire entries.
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  observed: Element[] = []
  disconnected = false

  constructor(private callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }

  observe(el: Element) { this.observed.push(el) }
  unobserve() {}
  disconnect() { this.disconnected = true }

  fire(isIntersecting: boolean) {
    const entry = { isIntersecting } as IntersectionObserverEntry
    this.callback([entry], this as unknown as IntersectionObserver)
  }
}

beforeEach(() => {
  MockIntersectionObserver.instances = []
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
})

afterEach(() => vi.unstubAllGlobals())

describe("useIntersectionObserver", () => {
  it("observes the ref element and reports entries", () => {
    // Refs are stable objects in real usage (useRef); an inline literal would re-run the effect.
    const ref = { current: document.createElement("div") }
    const { result } = renderHook(() => useIntersectionObserver(ref))

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.observed).toEqual([ref.current])
    expect(result.current).toBeNull()

    act(() => observer.fire(true))
    expect(result.current?.isIntersecting).toBe(true)

    act(() => observer.fire(false))
    expect(result.current?.isIntersecting).toBe(false)
  })

  it("creates no observer while the ref is empty", () => {
    const ref = { current: null }
    renderHook(() => useIntersectionObserver(ref))
    expect(MockIntersectionObserver.instances).toHaveLength(0)
  })

  it("stops observing after the first intersection when once is set", () => {
    const ref = { current: document.createElement("div") }
    const { result } = renderHook(() => useIntersectionObserver(ref, { once: true }))

    const observer = MockIntersectionObserver.instances[0]
    act(() => observer.fire(false))
    expect(observer.disconnected).toBe(false)

    act(() => observer.fire(true))
    expect(observer.disconnected).toBe(true)
    // The last entry stays available after disconnecting.
    expect(result.current?.isIntersecting).toBe(true)
  })

  it("disconnects on unmount", () => {
    const ref = { current: document.createElement("div") }
    const { unmount } = renderHook(() => useIntersectionObserver(ref))

    unmount()
    expect(MockIntersectionObserver.instances[0].disconnected).toBe(true)
  })
})
