// Human-readable date fragments for read views and job tables.

// Backend DateOnly fields and the parse endpoint return "YYYY-MM-DD". new Date() reads that
// as UTC midnight, shifting the day backwards in UTC+ time zones; the 3-arg constructor is
// always local time. DateOnly months are 1-indexed, JS Date months 0-indexed, hence m - 1.
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** e.g. formatMonthYear(2021, 3) -> "Mar 2021"; month is 1-indexed, or null/undefined for year-only. */
export function formatMonthYear(year: number, month?: number | null): string {
  return month ? `${MONTH_NAMES[month - 1]} ${year}` : String(year)
}

/** Locale date for an ISO timestamp; the null-placeholder "—" when absent. */
export function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—"
}

/** Locale date+time for an ISO timestamp; the null-placeholder "—" when absent. */
export function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"
}

/** Keeps `previous`'s time-of-day when only the day changes; a fresh pick defaults to noon. */
export function withPreservedTime(day: Date, previous: Date | undefined): Date {
  const combined = new Date(day)
  if (previous) {
    combined.setHours(previous.getHours(), previous.getMinutes(), 0, 0)
  } else {
    combined.setHours(12, 0, 0, 0)
  }
  return combined
}

/** Returns a new Date with the given hour/minute applied, keeping the same day. */
export function withTimeOfDay(date: Date, hours: number, minutes: number): Date {
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}
