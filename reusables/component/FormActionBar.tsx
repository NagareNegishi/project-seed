// Shared Cancel/Save action row for forms — optionally sticky to the viewport
// bottom for long pages (profile); sheets can embed it in a SheetFooter without sticky.
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  onCancel: () => void
  onSave: () => void
  saving?: boolean
  /** Disables Save beyond the saving state (e.g. nothing dirty, validation failing) */
  saveDisabled?: boolean
  error?: string
  cancelLabel?: string
  saveLabel?: string
  savingLabel?: string
  /** Stick to the bottom of the viewport while the page scrolls */
  sticky?: boolean
  className?: string
}

export default function FormActionBar({
  onCancel, onSave, saving = false, saveDisabled = false, error,
  cancelLabel = "Cancel", saveLabel = "Save", savingLabel = "Saving…",
  sticky = false, className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2",
        sticky && "sticky bottom-0 z-10 rounded-t-lg border-t bg-background/95 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      {error && <p className="mr-auto text-xs text-destructive">{error}</p>}
      <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
        {cancelLabel}
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving || saveDisabled}>
        {saving ? savingLabel : saveLabel}
      </Button>
    </div>
  )
}
