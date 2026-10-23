// Checkbox + label row for an "is current / ongoing" toggle. Callers own the
// patch applied when it flips.
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type Props = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function CurrentCheckbox({ id, label, checked, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <Checkbox id={id} checked={checked} onCheckedChange={c => onChange(c === true)} />
      <Label htmlFor={id} className="text-xs font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  )
}
