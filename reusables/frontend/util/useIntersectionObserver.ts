/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useIntersectionObserver — track whether the referenced
 *   element is visible in the viewport (or a scroll root).
 * USE WHEN: Lazy-loading, reveal-on-scroll animations, infinite
 *   scroll sentinels.
 * NOTES: Set `once` to stop observing after the first time the
 *   element becomes visible. Pass a stable `threshold` array
 *   (module-level or memoized) — a fresh array re-observes.
 * ─────────────────────────────────────────────────────────────── */

// Element-visibility hook wrapping IntersectionObserver.

import { useEffect, useState, type RefObject } from "react"

export interface IntersectionOptions extends IntersectionObserverInit {
  /** Stop observing after the element first intersects. Default false. */
  once?: boolean
}

/** Latest IntersectionObserverEntry for `ref`'s element; null before the first callback. */
export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options: IntersectionOptions = {},
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const { root = null, rootMargin, threshold, once = false } = options

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(([e]) => {
      setEntry(e)
      if (once && e.isIntersecting) observer.disconnect()
    }, { root, rootMargin, threshold })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, root, rootMargin, threshold, once])

  return entry
}
