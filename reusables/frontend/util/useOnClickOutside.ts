/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useOnClickOutside — run a handler when the user presses
 *   outside the referenced element.
 * USE WHEN: Closing dropdowns, popovers, or menus on outside
 *   click; SuggestionInput uses it.
 * NOTES: Listens on mousedown/touchstart (not click) so it fires
 *   before focus moves. Elements rendered in portals count as
 *   "outside" unless they sit inside the ref element.
 * ─────────────────────────────────────────────────────────────── */

// Outside-press hook for dismissable overlays.

import { useEffect, useRef, type RefObject } from "react"

/** Calls `handler` on any mousedown/touchstart outside `ref`'s element. */
export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  // Latest handler without re-binding the document listeners every render.
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(event.target as Node)) return
      handlerRef.current(event)
    }
    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref])
}
