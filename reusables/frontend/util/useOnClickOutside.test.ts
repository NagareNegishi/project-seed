import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useOnClickOutside } from "./useOnClickOutside"

let inside: HTMLDivElement
let child: HTMLSpanElement
let outside: HTMLButtonElement

beforeEach(() => {
  inside = document.createElement("div")
  child = document.createElement("span")
  inside.appendChild(child)
  outside = document.createElement("button")
  document.body.append(inside, outside)
})

afterEach(() => {
  inside.remove()
  outside.remove()
})

function mouseDown(target: Element) {
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
}

describe("useOnClickOutside", () => {
  it("fires on a press outside the element", () => {
    const handler = vi.fn()
    const ref = { current: inside }
    renderHook(() => useOnClickOutside(ref, handler))

    mouseDown(outside)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("ignores presses inside the element and its children", () => {
    const handler = vi.fn()
    const ref = { current: inside }
    renderHook(() => useOnClickOutside(ref, handler))

    mouseDown(inside)
    mouseDown(child)
    expect(handler).not.toHaveBeenCalled()
  })

  it("does nothing while the ref is empty", () => {
    const handler = vi.fn()
    const ref = { current: null }
    renderHook(() => useOnClickOutside(ref, handler))

    mouseDown(outside)
    expect(handler).not.toHaveBeenCalled()
  })

  it("uses the latest handler without re-binding", () => {
    const first = vi.fn()
    const second = vi.fn()
    const ref = { current: inside }
    const { rerender } = renderHook(
      ({ handler }) => useOnClickOutside(ref, handler),
      { initialProps: { handler: first } }
    )

    rerender({ handler: second })
    mouseDown(outside)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("stops listening after unmount", () => {
    const handler = vi.fn()
    const ref = { current: inside }
    const { unmount } = renderHook(() => useOnClickOutside(ref, handler))

    unmount()
    mouseDown(outside)
    expect(handler).not.toHaveBeenCalled()
  })
})
