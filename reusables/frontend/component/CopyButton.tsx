/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: CopyButton — icon button that copies `text` and flashes a
 *   check mark as feedback.
 * USE WHEN: Next to anything worth copying: codes, ids, links,
 *   code blocks.
 * NOTES: Needs the async Clipboard API (secure context), via
 *   useCopyToClipboard.
 * ─────────────────────────────────────────────────────────────── */

// Copy-to-clipboard button with check-mark feedback.

import { Check, Copy } from "lucide-react"
import { Button, type buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import { useCopyToClipboard } from "@/utils/useCopyToClipboard"

interface CopyButtonProps extends VariantProps<typeof buttonVariants> {
  /** The text placed on the clipboard. */
  text: string
  /** Accessible name; also shown in the browser tooltip. */
  label?: string
  className?: string
}

/** Button that copies `text` and shows a check mark for a moment. */
export function CopyButton({ text, label = "Copy", variant = "ghost", size = "icon-sm", className }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={className}
      onClick={() => copy(text)}
    >
      {copied ? <Check aria-hidden className="text-green-600 dark:text-green-500" /> : <Copy aria-hidden />}
    </Button>
  )
}
