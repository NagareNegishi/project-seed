// Month + year selector row for coarse date fields (month optional, year required).
import { Label } from "@/components/ui/label"
import MonthSelect from "./MonthSelect"
import YearSelect from "./YearSelect"

type Props = {
  label: string
  month: number | null
  year: number
  onMonthChange: (v: number) => void
  onYearChange: (v: number) => void
}

export default function MonthYearPicker({ label, month, year, onMonthChange, onYearChange }: Props) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <MonthSelect value={month} onChange={onMonthChange} />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">
            Year <span className="text-destructive">*</span>
          </Label>
          <YearSelect value={year} onChange={onYearChange} />
        </div>
      </div>
    </div>
  )
}
