/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: ThemeToggle — sun/moon button that flips light/dark mode
 *   via useTheme.
 * USE WHEN: App header or settings row; anywhere the user switches
 *   theme.
 * NOTES: useTheme keeps its state locally — mount one ThemeToggle
 *   (or lift the hook and pass props) so there is a single writer.
 *   Two-state by design; OS preference only seeds the first visit.
 * ─────────────────────────────────────────────────────────────── */

// Light/dark theme toggle button wired to useTheme.

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/utils/useTheme"

/** Button showing the theme it switches to: moon in light mode, sun in dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      onClick={toggleTheme}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  )
}
