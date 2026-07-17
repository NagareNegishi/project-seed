// Generic confirmation dialog used as the base for all confirm/alert flows.

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ConfirmDialogProps defines the props for the ConfirmDialog component
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  onConfirm: () => void
  confirmLabel: string
  confirmClassName?: string  // optional styling for the confirm button; omit for plain outline
  cancelLabel?: string       // optional; defaults to "Cancel"
  onCancel?: () => void      // called when Cancel is clicked; omit to just close the dialog
}

/**
 * ConfirmDialog provides a reusable two-button confirmation dialog.
 * Use confirmLabel and confirmClassName to specialise for a specific action.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
  confirmClassName,
  cancelLabel,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => { onOpenChange(false); onCancel?.() }}>
            {cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant="outline"
            className={confirmClassName}
            onClick={() => { onOpenChange(false); onConfirm() }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
