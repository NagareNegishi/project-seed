import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ErrorBoundary } from "./ErrorBoundary"

/** Throws while `shouldThrow` is true, renders "ok" otherwise. */
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("boom")
  return <p>ok</p>
}

// React logs every caught error to console.error; keep test output clean.
beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

describe("ErrorBoundary", () => {
  it("renders children while nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText("content")).toBeTruthy()
  })

  it("shows the default fallback with the error message", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByRole("alert")).toBeTruthy()
    expect(screen.getByText("boom")).toBeTruthy()
  })

  it("recovers when retry is clicked after the cause is gone", () => {
    // Rerender with a fixed child first, then retry.
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(screen.getByText("ok")).toBeTruthy()
  })

  it("uses a custom fallback and its reset callback", () => {
    const { rerender } = render(
      <ErrorBoundary fallback={(error, reset) => <button onClick={reset}>retry: {error.message}</button>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    rerender(
      <ErrorBoundary fallback={(error, reset) => <button onClick={reset}>retry: {error.message}</button>}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByRole("button", { name: "retry: boom" }))
    expect(screen.getByText("ok")).toBeTruthy()
  })

  it("reports the error through onError", () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})
