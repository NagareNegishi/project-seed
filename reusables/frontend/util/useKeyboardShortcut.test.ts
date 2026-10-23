import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useKeyboardShortcut } from "./useKeyboardShortcut"

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe("useKeyboardShortcut", () => {
  it("fires on the bound key and prevents default", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler))

    const event = press("k")
    expect(handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it("matches the key case-insensitively", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler))

    press("K", { shiftKey: false })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("requires listed modifiers", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler, { ctrl: true }))

    press("k")
    expect(handler).not.toHaveBeenCalled()

    press("k", { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("rejects extra modifiers that were not listed", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler))

    press("k", { ctrlKey: true })
    press("k", { altKey: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it("skips presses while typing in an input", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler))

    press("k", {}, input)
    expect(handler).not.toHaveBeenCalled()
    input.remove()
  })

  it("fires in inputs when allowInInputs is set", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("k", handler, { allowInInputs: true }))

    press("k", {}, input)
    expect(handler).toHaveBeenCalledTimes(1)
    input.remove()
  })

  it("lets Escape through even in an input", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut("Escape", handler))

    press("Escape", {}, input)
    expect(handler).toHaveBeenCalledTimes(1)
    input.remove()
  })

  it("stops listening after unmount", () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcut("k", handler))

    unmount()
    press("k")
    expect(handler).not.toHaveBeenCalled()
  })
})
