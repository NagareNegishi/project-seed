import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CopyButton } from "./CopyButton"

// jsdom has no navigator.clipboard; install a stub per test.
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("CopyButton", () => {
  it("copies the given text on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    render(<CopyButton text="api-key-123" />)

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })))
    expect(writeText).toHaveBeenCalledWith("api-key-123")
  })

  it("flashes Copied feedback, then returns to normal", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    render(<CopyButton text="x" />)

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })))
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy()
  })

  it("uses a custom label", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    render(<CopyButton text="x" label="Copy link" />)
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy()
  })
})
