// Generic hook: reset a dialog/sheet's form state on open via remount, not a useEffect side effect.
import { useCallback, useState } from "react"

/**
 * `key` changes on each `openDialog()` call - pass it to the dialog/sheet so
 * React remounts it and its `useState(() => toFormState(item))` initializer
 * runs fresh from current props.
 */
export function useRemountableDialog() {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(0)

  const openDialog = useCallback(() => {
    setKey(k => k + 1)
    setOpen(true)
  }, [])

  return { open, setOpen, openDialog, key }
}
