/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: SearchInput — search box that fires `onSearch` after the
 *   user stops typing, with a clear button.
 * USE WHEN: Search-as-you-type over lists or API queries, where
 *   reacting to every keystroke would be wasteful.
 * NOTES: Uncontrolled — it owns the text; treat `onSearch` as the
 *   output. Clearing fires immediately, typing is debounced.
 * ─────────────────────────────────────────────────────────────── */

// Debounced search input with a clear button.

import { useEffect, useRef, useState, type ComponentProps } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/utils/useDebouncedValue"

interface SearchInputProps extends Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "onSearch"> {
  /** Fired with the query after `delayMs` of quiet (immediately on clear). */
  onSearch: (query: string) => void
  delayMs?: number
  /** Text to start with, e.g. a query restored from the URL. */
  initialValue?: string
}

/** Search box that debounces typing into `onSearch` calls. */
export function SearchInput({ onSearch, delayMs = 300, initialValue = "", className, ...props }: SearchInputProps) {
  const [value, setValue] = useState(initialValue)
  const debounced = useDebouncedValue(value, delayMs)
  const inputRef = useRef<HTMLInputElement>(null)

  // Latest callback and last query emitted. Seeding with the initial value
  // means mount never emits; dedupe also absorbs the debounced echo of an
  // immediate clear.
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch
  const lastEmittedRef = useRef(initialValue)

  const emit = (query: string) => {
    if (lastEmittedRef.current === query) return
    lastEmittedRef.current = query
    onSearchRef.current(query)
  }

  // Only debounced settles a new query; emit itself reads refs, so it is
  // safe to leave out of the deps.
  useEffect(() => emit(debounced), [debounced])

  const clear = () => {
    setValue("")
    emit("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        className={cn("px-9 [&::-webkit-search-cancel-button]:hidden", className)}
        {...props}
      />
      {value !== "" && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
          onClick={clear}
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
