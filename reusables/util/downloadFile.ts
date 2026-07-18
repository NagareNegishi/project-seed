/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: downloadFile(content, filename) — triggers a browser
 *   download of in-memory data via a temporary object URL.
 * USE WHEN: Exporting CSV/JSON/text the app built client-side, or
 *   saving a Blob (canvas image, fetched file) without a server
 *   round-trip.
 * NOTES: Browser only (needs document + URL.createObjectURL).
 *   Must run in a user-gesture handler or popup blockers may eat it.
 * ─────────────────────────────────────────────────────────────── */

// Client-side file download via object URL + synthetic anchor click.

/** Downloads `content` as a file named `filename`; `mimeType` applies to string content only. */
export function downloadFile(
  content: Blob | string,
  filename: string,
  mimeType = "text/plain"
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link) // Firefox ignores clicks on detached anchors
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
