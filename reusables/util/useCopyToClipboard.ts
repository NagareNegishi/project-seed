/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useCopyToClipboard — copy text and get a `copied` flag
 *   that resets itself after a moment, for "Copied!" feedback.
 * USE WHEN: Copy buttons next to codes, links, ids; CopyButton is
 *   built on it.
 * NOTES: Needs the async Clipboard API (secure context). `copy`
 *   resolves false when the browser refuses.
 * ─────────────────────────────────────────────────────────────── */

// Clipboard-write hook with self-resetting "copied" feedback state.

import { useCallback, useEffect, useRef, useState } from "react"

/** Returns `{ copied, copy }`; `copied` turns off after `resetAfterMs`. */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  /** Writes text to the clipboard; resolves true on success. */
  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      setCopied(false)
      return false
    }
    setCopied(true)
    // Restart the reset timer so rapid copies keep the flag on.
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs)
    return true
  }, [resetAfterMs])

  return { copied, copy }
}
