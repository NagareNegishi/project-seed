import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SearchInput } from "./SearchInput"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function type(text: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: text } })
}

describe("SearchInput", () => {
  it("does not fire on mount", () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(onSearch).not.toHaveBeenCalled()
  })

  it("fires once with the settled query after the delay", () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} delayMs={300} />)

    type("he")
    act(() => vi.advanceTimersByTime(200))
    type("hello")
    expect(onSearch).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("hello")
  })

  it("clears immediately without a debounced duplicate", () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} delayMs={300} />)

    type("hello")
    act(() => vi.advanceTimersByTime(300))
    onSearch.mockClear()

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("")
    expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("")

    // The debounce catching up to "" must not fire a second time.
    act(() => vi.advanceTimersByTime(300))
    expect(onSearch).toHaveBeenCalledOnce()
  })

  it("shows the clear button only while there is text", () => {
    render(<SearchInput onSearch={() => {}} />)
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()

    type("x")
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy()
  })

  it("starts from initialValue without firing", () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} initialValue="draft" />)
    expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("draft")
    act(() => vi.advanceTimersByTime(1000))
    expect(onSearch).not.toHaveBeenCalled()
  })
})
