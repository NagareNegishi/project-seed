// Shared row chrome for one entry in an entry-based profile section:
// bordered box with a trailing trash delete button. Also exports the
// footer "add another entry" button used below the entry list.
import type { ReactNode, Ref } from "react"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EntryRowProps = {
  /** Attach the section's lastEntryRef here on the final entry for scroll-on-add */
  ref?: Ref<HTMLDivElement>
  onRemove: () => void
  /** Overrides for the default box layout (e.g. items-center / tighter padding) */
  className?: string
  children: ReactNode
}

export default function EntryRow({ ref, onRemove, className, children }: EntryRowProps) {
  return (
    <div ref={ref} className={cn("flex items-start gap-2 bg-muted/50 border rounded-md p-3", className)}>
      {children}
      <Button
        size="icon" variant="ghost"
        className="text-muted-foreground hover:text-destructive shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

type AddEntryButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
}

/** Footer button appending a blank entry to the section's list. */
export function AddEntryButton({ label, onClick, disabled }: AddEntryButtonProps) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={disabled} className="gap-1">
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  )
}
