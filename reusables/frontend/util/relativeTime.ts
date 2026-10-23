/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: relativeTime(date) — "3 days ago", "in 2 hours",
 *   "yesterday" via Intl.RelativeTimeFormat.
 * USE WHEN: Showing timestamps relative to now: feeds, comment
 *   lists, "last updated" labels. The usual reason date-fns gets
 *   installed.
 * NOTES: Output is a snapshot — re-render periodically if it must
 *   stay current. Pass `now` for stable output in tests.
 * ─────────────────────────────────────────────────────────────── */

// Human-readable relative time via Intl.RelativeTimeFormat.

// Each entry: how many of this unit fit in the next one up.
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
]

export interface RelativeTimeOptions {
  /** BCP 47 locale. Default "en". */
  locale?: string
  /** Reference point the date is compared against. Default: current time. */
  now?: Date | number
}

/** Formats `date` relative to now, picking the largest unit that fits. */
export function relativeTime(
  date: Date | number | string,
  options: RelativeTimeOptions = {}
): string {
  const { locale = "en", now = Date.now() } = options
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  let delta = (new Date(date).getTime() - new Date(now).getTime()) / 1000
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(delta) < amount) return formatter.format(Math.round(delta), unit)
    delta /= amount
  }
  return formatter.format(Math.round(delta), "year")
}
