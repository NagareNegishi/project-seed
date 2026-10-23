// A single dropdown of 15-minute time-of-day slots, instead of a native
// <input type="time"> whose segmented editing is inconsistent across browsers.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { withTimeOfDay } from "@/utils/dateFormat"

const SLOT_MINUTES = 15
const SLOTS = Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, i) => i * SLOT_MINUTES) // minutes since midnight

function label(minutesSinceMidnight: number): string {
  const hour = Math.floor(minutesSinceMidnight / 60)
  const minute = minutesSinceMidnight % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

interface TimeSelectProps {
  value: Date
  onChange: (date: Date) => void
  disabled?: boolean
}

export function TimeSelect({ value, onChange, disabled }: TimeSelectProps) {
  // Snaps to the nearest slot so the select always has a matching value.
  const slot = Math.round((value.getHours() * 60 + value.getMinutes()) / SLOT_MINUTES) * SLOT_MINUTES % (24 * 60)

  function emit(nextSlot: number) {
    onChange(withTimeOfDay(value, Math.floor(nextSlot / 60), nextSlot % 60))
  }

  return (
    <Select value={String(slot)} onValueChange={v => emit(Number(v))} disabled={disabled}>
      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
      <SelectContent className="min-w-0">
        {SLOTS.map(s => <SelectItem key={s} value={String(s)}>{label(s)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
