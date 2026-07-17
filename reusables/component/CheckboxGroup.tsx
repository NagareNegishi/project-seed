// Pure, controlled checkbox multi-select — no save/dirty chrome (that lives in the caller).
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type Props<T extends string> = {
  options: readonly T[]
  value: T[]
  onChange: (values: T[]) => void
  getLabel?: (opt: T) => string
  idPrefix: string
  showSelectAll?: boolean
}

export default function CheckboxGroup<T extends string>({
  options, value, onChange, getLabel = String, idPrefix, showSelectAll = false,
}: Props<T>) {
  const allSelected = options.length > 0 && options.every(o => value.includes(o))
  const someSelected = value.length > 0 && !allSelected

  function toggle(opt: T) {
    const next = value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]
    // Normalize to canonical option order so toggle sequence never produces a spurious dirty diff downstream.
    onChange(options.filter(o => next.includes(o)))
  }

  return (
    <div className="space-y-2">
      {showSelectAll && (
        <div className="flex items-center gap-1.5 pb-1 border-b">
          <Checkbox
            id={`${idPrefix}-select-all`}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={() => onChange(allSelected ? [] : [...options])}
          />
          <Label htmlFor={`${idPrefix}-select-all`} className="text-sm font-normal cursor-pointer">
            Select all
          </Label>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(opt => (
          <div key={opt} className="flex items-center gap-1.5">
            <Checkbox
              id={`${idPrefix}-${opt}`}
              checked={value.includes(opt)}
              onCheckedChange={() => toggle(opt)}
            />
            <Label htmlFor={`${idPrefix}-${opt}`} className="text-sm font-normal cursor-pointer">
              {getLabel(opt)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
