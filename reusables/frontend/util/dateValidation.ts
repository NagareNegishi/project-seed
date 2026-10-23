// Validates that a from→to date range is chronologically possible.
// Granularity is determined by the overload used; month ordering is only checked
// when both months are provided, and day ordering only when both days are provided.
// toYear === null or 0 (no end date) always returns null — no range to check.
// The caller is responsible for ensuring consistent granularity between from and to.

export function checkDateOrder(fromYear: number, toYear: number | null): string | null
export function checkDateOrder(fromYear: number, toYear: number | null, fromMonth: number | null, toMonth: number | null): string | null
export function checkDateOrder(fromYear: number, toYear: number | null, fromMonth: number | null, toMonth: number | null, fromDay: number | null, toDay: number | null): string | null
export function checkDateOrder(
  fromYear: number,
  toYear: number | null,
  fromMonth?: number | null,
  toMonth?: number | null,
  fromDay?: number | null,
  toDay?: number | null,
): string | null {
  if (!toYear) return null
  if (toYear < fromYear) return "End year must be after start year."
  if (toYear === fromYear && fromMonth != null && toMonth != null) {
    if (toMonth < fromMonth) return "End month must be after start month."
    if (toMonth === fromMonth && fromDay != null && toDay != null) {
      if (toDay < fromDay) return "End day must be after start day."
    }
  }
  return null
}

// Rejects a year/month that lies in the future, mirroring the backend's not-future rule.
// Month is optional: a future month is only flagged within the current year (year alone can't
// exceed the current year via the picker, but we check it anyway to stay in step with the API).
// year null or 0 (not selected) returns null — the required check handles that case.
export function checkNotFuture(year: number | null, month: number | null): string | null {
  if (!year) return null
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // getMonth() is 0-based; API months are 1-based
  if (year > currentYear || (year === currentYear && month != null && month > currentMonth))
    return "Date cannot be in the future."
  return null
}
