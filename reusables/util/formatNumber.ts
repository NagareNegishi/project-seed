/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: Number formatters — plain grouped numbers, currency,
 *   compact ("1.2K"), and byte sizes — all via Intl.NumberFormat.
 * USE WHEN: Displaying any number to a user: prices, counts,
 *   file sizes, stats. Zero dependencies, locale-correct.
 * NOTES: Pass a locale to override the "en" default. formatBytes
 *   scales by 1024 but shows decimal unit names (kB, MB) as Intl
 *   defines them.
 * ─────────────────────────────────────────────────────────────── */

// Locale-aware number formatting built on Intl.NumberFormat.

/** "1,234,567.891" — grouped decimal in the given locale. */
export function formatNumber(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** "$1,234.50" — amount with the currency's standard symbol and decimals. */
export function formatCurrency(value: number, currency: string, locale = "en"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)
}

/** "1.2K", "3.4M" — compact notation for counts and stats. */
export function formatCompact(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

const BYTE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"] as const

/** "1.5 kB", "2 MB" — byte count scaled by 1024 per step, one decimal at most. */
export function formatBytes(bytes: number, locale = "en"): string {
  // log2 / 10 picks the 1024^n step; clamp keeps 0 and huge values in range
  const step = Math.max(
    0,
    Math.min(Math.floor(Math.log2(Math.abs(bytes) || 1) / 10), BYTE_UNITS.length - 1)
  )
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: BYTE_UNITS[step],
    maximumFractionDigits: 1,
  }).format(bytes / 1024 ** step)
}
