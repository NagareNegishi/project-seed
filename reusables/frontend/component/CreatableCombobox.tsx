// Creatable combobox: pick from a suggestion list, or type a value with no
// match and commit it via an "Add …" item. Unlike a closed-set combobox,
// free text is always allowed as long as it fits `maxLength`.
// Generalized from `LanguageCombobox` - the language-specific suggestion
// pool and length cap are now props.
import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command, CommandEmpty, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  excludeValues?: string[]
  maxLength?: number
  placeholder?: string
}

export default function CreatableCombobox({
  value, onChange, suggestions, excludeValues, maxLength, placeholder = "Select…",
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  function commit(item: string) {
    onChange(item)
    setQuery("")
    setOpen(false)
  }

  // Offer the typed value when it is non-empty, within the length cap, and not
  // already an existing option - matched case-insensitively.
  const trimmed = query.trim()
  const tooLong = maxLength !== undefined && trimmed.length > maxLength
  const taken = (name: string) => name.toLowerCase() === trimmed.toLowerCase()
  const canCreate =
    trimmed.length > 0 &&
    !tooLong &&
    !suggestions.some(taken) &&
    !excludeValues?.some(taken)

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setQuery("") }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search…" value={query} onValueChange={setQuery} />
          <CommandList>
            {!canCreate && (
              <CommandEmpty>
                {tooLong
                  ? `Must be ${maxLength} characters or fewer.`
                  : "No match found."}
              </CommandEmpty>
            )}
            {suggestions.filter(name => !excludeValues?.includes(name)).map(name => (
              <CommandItem key={name} value={name} onSelect={() => commit(name)}>
                {name}
                <Check className={cn("ml-auto h-4 w-4", value === name ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
            {canCreate && (
              // value carries the query so cmdk's filter always keeps this item visible
              <CommandItem value={`add-${trimmed}`} onSelect={() => commit(trimmed)}>
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                Add "{trimmed}"
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
