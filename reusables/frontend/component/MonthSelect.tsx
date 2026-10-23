// Reusable month dropdown; null = not selected (month is always optional).
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const MONTHS = [
  { value: "1", label: "January" },  { value: "2", label: "February" },
  { value: "3", label: "March" },    { value: "4", label: "April" },
  { value: "5", label: "May" },      { value: "6", label: "June" },
  { value: "7", label: "July" },     { value: "8", label: "August" },
  { value: "9", label: "September" },{ value: "10", label: "October" },
  { value: "11", label: "November" },{ value: "12", label: "December" },
]

type Props = {
  value: number | null
  onChange: (v: number) => void
}

export default function MonthSelect({ value, onChange }: Props) {
  return (
    <Select
      value={value !== null ? String(value) : ""}
      onValueChange={v => onChange(parseInt(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Optional" />
      </SelectTrigger>
      <SelectContent>
        {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
