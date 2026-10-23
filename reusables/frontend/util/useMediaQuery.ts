/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useMediaQuery — a boolean that tracks whether a CSS media
 *   query currently matches, updating live.
 * USE WHEN: Rendering different markup by viewport or capability —
 *   e.g. "(max-width: 640px)", "(prefers-reduced-motion: reduce)".
 * NOTES: For styling-only differences prefer CSS; use this when
 *   the rendered tree itself must change.
 * ─────────────────────────────────────────────────────────────── */

// Live media-query match hook.

import { useEffect, useState } from "react"

/** True while `query` (e.g. "(max-width: 640px)") matches. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    // Re-sync in case the query changed between render and effect.
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}
