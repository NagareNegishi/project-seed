/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: PasswordInput — shadcn Input with a show/hide visibility
 *   toggle.
 * USE WHEN: Any password field: login, registration, change
 *   password.
 * NOTES: Accepts all input props except `type`, which the toggle
 *   owns.
 * ─────────────────────────────────────────────────────────────── */

// Password input with a show/hide visibility toggle.

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">

/** Password field whose trailing eye button toggles text visibility. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        onClick={() => setVisible(v => !v)}
      >
        {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </div>
  )
}
