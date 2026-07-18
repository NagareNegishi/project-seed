/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: EmptyState — centered icon + title + description + action
 *   slot for views with nothing to show.
 * USE WHEN: Empty lists, zero search results, cleared filters —
 *   anywhere the alternative is a blank area.
 * NOTES: Pass the action as a ready element (usually a Button);
 *   the component only positions it.
 * ─────────────────────────────────────────────────────────────── */

// Centered placeholder for empty lists and no-result views.

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Optional call to action, e.g. a "New entry" button. */
  action?: ReactNode
  className?: string
}

/** Icon + message + optional action, centered in the available space. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-center", className)}>
      {Icon && <Icon aria-hidden className="size-10 text-muted-foreground/60" />}
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
