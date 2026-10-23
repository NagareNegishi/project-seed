// Single-value text input with optional type-ahead suggestions dropdown.
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { matchesSuggestion } from "@/utils/matchSuggestion"
import { useOnClickOutside } from "@/utils/useOnClickOutside"

type Props = {
  value: string
  onChange: (v: string) => void
  suggestions?: string[]
  placeholder?: string
  maxLength?: number
  className?: string
}

export default function SuggestionInput({
  value, onChange, suggestions = [], placeholder, maxLength, className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Only show when user has typed something and there are matches excluding the current exact value.
  const filtered = suggestions.filter(s =>
    value.length > 0 && matchesSuggestion(s, value, "word-start") && s !== value
  )
  const showDropdown = open && filtered.length > 0

  useOnClickOutside(containerRef, () => setOpen(false))

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === "Enter" && highlighted >= 0) { e.preventDefault(); pick(filtered[highlighted]) }
    else if (e.key === "Escape") { setOpen(false); setHighlighted(-1) }
  }

  function pick(s: string) {
    onChange(s)
    setOpen(false)
    setHighlighted(-1)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setHighlighted(-1); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {showDropdown && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto py-1">
          {filtered.map((s, idx) => (
            <li
              key={s}
              onMouseDown={e => { e.preventDefault(); pick(s) }}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm",
                idx === highlighted
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
