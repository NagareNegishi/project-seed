// Shared state handlers for entry-based array sections: add/update/remove an entry
// plus the header-add flow that opens edit mode and scrolls to the new entry.
import { useScrollToNewItem } from "./useScrollToNewItem"

/**
 * Entry-list machinery shared by multi-entry sections.
 *
 * @param value      current entry array (controlled by the page)
 * @param onChange   replaces the whole entry array
 * @param emptyEntry factory for a blank entry
 * @param onEdit     switches the section into edit mode
 */
export function useEntryList<T extends object>(
  value: T[],
  onChange: (value: T[]) => void,
  emptyEntry: () => T,
  onEdit: () => void,
) {
  // Scroll the entry appended by header-add into view once edit mode has rendered it
  const { lastItemRef: lastEntryRef, requestScroll } = useScrollToNewItem()

  function addEntry() {
    onChange([...value, emptyEntry()])
  }

  // Header + button: blank entry ready to fill, whether the section was empty or not
  function handleAdd() {
    addEntry()
    onEdit()
    requestScroll()
  }

  function updateEntry(index: number, patch: Partial<T>) {
    onChange(value.map((e, i) => i === index ? { ...e, ...patch } : e))
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return { lastEntryRef, addEntry, handleAdd, updateEntry, removeEntry }
}
