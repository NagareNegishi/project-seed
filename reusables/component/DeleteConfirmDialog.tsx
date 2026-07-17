// Concrete confirmation dialog for destructive delete actions.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

// DeleteConfirmDialogProps defines the props for the DeleteConfirmDialog component
interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode  // ReactNode allows JSX (e.g. <br />) for formatted messages
  onConfirm: () => void
}

/**
 * DeleteConfirmDialog provides a reusable confirmation dialog for destructive actions.
 */
export function DeleteConfirmDialog(props: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      confirmLabel="Delete"
      confirmClassName={cn(
        "border-destructive/50 text-destructive/70",
        "hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
      )}
    />
  )
}
