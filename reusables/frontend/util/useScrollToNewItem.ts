// Generic hook: scroll a newly appended list item into view once it has rendered.
import { useEffect, useRef } from "react"

/**
 * Tracks the last item of a growing list and smooth-scrolls it into view
 * after a render that follows a `requestScroll()` call.
 *
 * Attach `lastItemRef` to the final item's element and call `requestScroll()`
 * right before appending; the scroll fires once the new item exists in the DOM.
 */
export function useScrollToNewItem<E extends HTMLElement = HTMLDivElement>() {
  const lastItemRef = useRef<E | null>(null)
  const scrollPending = useRef(false)

  // No dep array: the new item may appear on any later render (e.g. after
  // edit mode mounts), so check the pending flag every time.
  useEffect(() => {
    if (scrollPending.current && lastItemRef.current) {
      lastItemRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      scrollPending.current = false
    }
  })

  function requestScroll() {
    scrollPending.current = true
  }

  return { lastItemRef, requestScroll }
}
