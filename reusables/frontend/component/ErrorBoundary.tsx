/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: ErrorBoundary — class boundary that catches render errors
 *   below it and shows a fallback with a retry button.
 * USE WHEN: Wrap the app root and any route/panel that should fail
 *   alone instead of blanking the page. React ships no boundary.
 * NOTES: Catches render/lifecycle errors only — not event handlers
 *   or async code. Retry re-renders the same children; if the cause
 *   persists it will trip again.
 * ─────────────────────────────────────────────────────────────── */

// React error boundary with a default retryable fallback.

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Called once per caught error, e.g. to report it. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Catches render errors in its subtree and shows a fallback with retry. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  /** Clears the caught error so the children render again. */
  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (error === null) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return (
      <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium">Something went wrong</p>
        <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={this.reset}>
          Try again
        </Button>
      </div>
    )
  }
}
