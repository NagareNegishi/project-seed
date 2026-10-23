// Generic add/edit/delete-confirm state machine for an array-field editor.
// Generalized from `useEditableJobList`/`useEditableStatusList` - callers now
// own persistence via `onSave`/`onDelete` instead of this hook importing
// specific mutation hooks.
import { useState } from "react"
import { useRemountableDialog } from "./useRemountableDialog"

/**
 * Indexes are resolved by identity, so `items` must be the same array the
 * caller renders. `onSave`'s second argument is `undefined` when adding.
 */
export function useEditableList<T>(
  items: T[],
  onSave: (value: T, index: number | undefined) => void,
  onDelete: (item: T, index: number) => void,
) {
  const { open, setOpen, openDialog, key } = useRemountableDialog()
  const [selected, setSelected] = useState<T | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<T | null>(null)

  // Open the dialog with an empty form
  function handleAdd() {
    setSelected(undefined)
    openDialog()
  }

  // Open the dialog populated from the given item
  function handleEdit(item: T) {
    setSelected(item)
    openDialog()
  }

  // Save from the dialog: replace in place when editing, append when adding
  function handleSubmit(value: T) {
    const index = selected !== undefined ? items.indexOf(selected) : undefined
    onSave(value, index)
    setOpen(false)
  }

  // Queue an item for delete confirmation
  function handleDelete(item: T) {
    setToDelete(item)
    setDeleteOpen(true)
  }

  // Perform the delete once confirmed
  function handleDeleteConfirm() {
    if (toDelete === null) return
    onDelete(toDelete, items.indexOf(toDelete))
  }

  return {
    open, setOpen, key, selected,
    handleAdd, handleEdit, handleSubmit,
    deleteOpen, setDeleteOpen, handleDelete, handleDeleteConfirm,
  }
}
