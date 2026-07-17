// Reusable year dropdown; 0 = not yet selected (sentinel value, never a valid year).
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const CURRENT_YEAR = new Date().getFullYear()
// Descending so the most recent year appears first.
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i)

type Props = {
  value: number
  onChange: (v: number) => void
}

export default function YearSelect({ value, onChange }: Props) {
  return (
    <Select
      value={value !== 0 ? String(value) : ""}
      onValueChange={v => onChange(parseInt(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent>
        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
