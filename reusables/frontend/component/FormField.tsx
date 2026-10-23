/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: FormField — label + control slot + error/hint text, the
 *   row layout every form repeats.
 * USE WHEN: Any labelled form control. Pass the input as children
 *   and give it `id={htmlFor}` yourself.
 * NOTES: Layout only — no form state or validation. Error replaces
 *   the hint while present.
 * ─────────────────────────────────────────────────────────────── */

// Labelled form row: label, control slot, error or hint text.

import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  /** Id of the control inside `children`; wires the label to it. */
  htmlFor: string
  /** Marks the label with a required asterisk (visual only). */
  required?: boolean
  /** Validation message; shown in place of `hint` when set. */
  error?: string
  /** Help text under the control. */
  hint?: string
  children: ReactNode
  className?: string
}

/** Standard form row layout around a caller-provided control. */
export function FormField({ label, htmlFor, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
