import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useLocalStorage } from "./useLocalStorage"

beforeEach(() => localStorage.clear())

describe("useLocalStorage", () => {
  it("uses the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("k", 10))
    expect(result.current[0]).toBe(10)
  })

  it("reads an existing stored value", () => {
    localStorage.setItem("k", JSON.stringify({ open: true }))
    const { result } = renderHook(() => useLocalStorage("k", { open: false }))
    expect(result.current[0]).toEqual({ open: true })
  })

  it("falls back to the initial value on corrupt JSON", () => {
    localStorage.setItem("k", "{nope")
    const { result } = renderHook(() => useLocalStorage("k", "fallback"))
    expect(result.current[0]).toBe("fallback")
  })

  it("set updates state and persists as JSON", () => {
    const { result } = renderHook(() => useLocalStorage("k", 0))
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
    expect(localStorage.getItem("k")).toBe("5")
  })

  it("set accepts an updater function", () => {
    const { result } = renderHook(() => useLocalStorage("k", 1))
    act(() => result.current[1]((n) => n + 1))
    act(() => result.current[1]((n) => n + 1))
    expect(result.current[0]).toBe(3)
    expect(localStorage.getItem("k")).toBe("3")
  })

  it("applies storage events for its key (cross-tab writes)", () => {
    const { result } = renderHook(() => useLocalStorage("k", "old"))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "k", newValue: '"new"' }))
    })
    expect(result.current[0]).toBe("new")
  })

  it("resets to the initial value when the key is removed in another tab", () => {
    const { result } = renderHook(() => useLocalStorage("k", "initial"))
    act(() => result.current[1]("changed"))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "k", newValue: null }))
    })
    expect(result.current[0]).toBe("initial")
  })

  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => useLocalStorage("k", "mine"))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: '"x"' }))
    })
    expect(result.current[0]).toBe("mine")
  })
})
