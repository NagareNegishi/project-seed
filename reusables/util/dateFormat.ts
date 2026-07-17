// Human-readable date fragments for profile read views.

/** "Mar 2021" when a month is set, otherwise just "2021". */
export function formatMonthYear(year: number, month: number | null): string {
  if (!month) return String(year)
  return `${new Date(year, month - 1).toLocaleString("en", { month: "short" })} ${year}`
}
