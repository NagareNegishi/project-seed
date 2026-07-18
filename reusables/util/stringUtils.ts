/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: slugify (text → url-safe-slug) and truncate (shorten with
 *   an ellipsis, without splitting emoji or accented characters).
 * USE WHEN: Building URL segments or ids from titles; capping
 *   user-visible text to a length.
 * NOTES: slugify strips accents but drops non-Latin scripts
 *   entirely — don't use it on text that may be fully non-Latin.
 * ─────────────────────────────────────────────────────────────── */

// slugify and grapheme-safe truncate.

/** Lowercased URL-safe slug: accents stripped, non-alphanumerics collapsed to "-". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Shortens text to at most `maxLength` graphemes, ellipsis included.
 * Counts user-perceived characters, so emoji and accents never get split.
 */
export function truncate(text: string, maxLength: number, ellipsis = "…"): string {
  const graphemes = [...new Intl.Segmenter().segment(text)].map((s) => s.segment)
  if (graphemes.length <= maxLength) return text
  const keep = Math.max(0, maxLength - ellipsis.length)
  return graphemes.slice(0, keep).join("") + ellipsis
}
