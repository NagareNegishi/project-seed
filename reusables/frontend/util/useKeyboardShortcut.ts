/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useKeyboardShortcut — bind a handler to a key (plus
 *   modifiers) document-wide.
 * USE WHEN: App-level shortcuts: open search on "k"+ctrl/meta,
 *   close on Escape, save on ctrl+s.
 * NOTES: Skips presses while typing in inputs/textareas/
 *   contenteditable unless `allowInInputs`. Calls preventDefault
 *   when it fires. Modifiers must match exactly.
 * ─────────────────────────────────────────────────────────────── */

// Document-level keyboard shortcut hook.

import { useEffect, useRef } from "react"

export interface ShortcutOptions {
  /** Required modifiers; unlisted ones must NOT be pressed. */
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  /** Fire even when focus is in an input, textarea, or contenteditable. Default false. */
  allowInInputs?: boolean
}

// Shortcuts shouldn't hijack typing — Escape is the customary exception.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  )
}

/** Runs `handler` (with preventDefault) when `key` + exact modifiers are pressed. */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {},
) {
  const { ctrl = false, meta = false, shift = false, alt = false, allowInInputs = false } = options

  // Latest handler without re-binding the document listener every render.
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler }, [handler])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (event.ctrlKey !== ctrl || event.metaKey !== meta) return
      if (event.shiftKey !== shift || event.altKey !== alt) return
      if (!allowInInputs && key !== "Escape" && isTypingTarget(event.target)) return
      event.preventDefault()
      handlerRef.current(event)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [key, ctrl, meta, shift, alt, allowInInputs])
}
