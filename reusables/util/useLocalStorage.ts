/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: useLocalStorage — useState that persists to localStorage
 *   as JSON and stays in sync across tabs.
 * USE WHEN: Small user preferences that should survive reload —
 *   filters, collapsed panels, dismissed banners.
 * NOTES: Browser-only. The stored shape is asserted, not validated;
 *   corrupt or missing entries fall back to `initialValue`. Don't
 *   put secrets or large data here.
 * ─────────────────────────────────────────────────────────────── */

// Persistent useState backed by localStorage, with cross-tab sync.

import { useCallback, useEffect, useRef, useState } from "react"
import { safeJsonParseOr } from "./safeJsonParse"

/** Like useState, but persisted under `key` and synced across tabs. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Kept in a ref so an inline `initialValue` literal doesn't re-run effects.
  const initialRef = useRef(initialValue)

  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    return raw === null ? initialRef.current : safeJsonParseOr(raw, initialRef.current)
  })

  /** Accepts a value or updater function, like a useState setter. */
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = next instanceof Function ? next(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        // Quota exceeded or storage blocked — keep the in-memory state anyway.
      }
      return resolved
    })
  }, [key])

  // Storage events fire in *other* tabs; mirror their writes into this one.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      setValue(e.newValue === null ? initialRef.current : safeJsonParseOr(e.newValue, initialRef.current))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [key])

  return [value, set] as const
}
