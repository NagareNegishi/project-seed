/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: Spinner — inline spinning loader icon; PageLoader — the
 *   centered full-area variant with an optional label.
 * USE WHEN: Any loading state. Spinner inside buttons or rows,
 *   PageLoader while a whole page or section loads.
 * NOTES: Color comes from the surrounding text color; size via the
 *   `size` prop, not className.
 * ─────────────────────────────────────────────────────────────── */

// Inline loading spinner and a centered full-area page loader.

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const

interface SpinnerProps {
  size?: keyof typeof SIZES
  className?: string
}

/** Spinning loader icon; inherits the surrounding text color. */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return <Loader2 aria-hidden className={cn("animate-spin", SIZES[size], className)} />
}

interface PageLoaderProps {
  /** Text under the spinner, e.g. "Loading entries…". */
  label?: string
  className?: string
}

/** Centered full-area spinner for page and section loads. */
export function PageLoader({ label, className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground", className)}
    >
      <Spinner size="lg" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
