// LinkedIn-style inline view/edit card: a titled card that shows a read-only
// view with an edit (pencil) button, swaps in place to an edit form on click,
// and returns to the view on Save/Cancel. Handles an empty-state placeholder,
// an optional "add" (+) action, an error line, and the Save/Cancel footer.
// The caller supplies the read-only rendering via `view` and the edit form as children.
import type { ReactNode } from "react"
import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  title: string
  editing: boolean
  dirty: boolean
  saving: boolean
  saveBlocked?: boolean // caller-side validation failure; disables Save on top of !dirty
  error?: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void // reverts the value and exits edit mode (caller-owned)
  isEmpty: boolean     // show `emptyText` instead of `view`; header icon becomes +
  emptyText: string    // placeholder when empty, e.g. "No items added yet"
  onAdd?: () => void   // list cards: enter edit with a blank entry seeded
  view: ReactNode
  children: ReactNode
}

export default function InlineEditCard({
  title, editing, dirty, saving, saveBlocked, error,
  onEdit, onSave, onCancel, isEmpty, emptyText, onAdd, view, children,
}: Props) {
  return (
    <div className="bg-card rounded-lg border p-5 space-y-3">
      {/* min-h keeps the header height stable whether or not the pencil button renders */}
      <div className="flex items-center justify-between min-h-7">
        <h2 className="text-sm font-medium">{title}</h2>
        {!editing && (
          <div className="flex items-center gap-1">
            {/* List cards get a separate add-another button once entries exist */}
            {onAdd && !isEmpty && (
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                aria-label={`Add ${title}`}
                onClick={onAdd}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              aria-label={isEmpty ? `Add ${title}` : `Edit ${title}`}
              onClick={isEmpty && onAdd ? onAdd : onEdit} // empty list card: seed a blank entry too
            >
              {isEmpty ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <>
          {children}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving || !dirty || saveBlocked}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </>
      ) : isEmpty ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        view
      )}
    </div>
  )
}

/** Read-only chip list for tag/multi-select read views; mirrors a filled-chip style. */
export function ViewChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item}
          className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-3 py-1.5 text-sm font-semibold"
        >
          {item}
        </span>
      ))}
    </div>
  )
}
