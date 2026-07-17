export function validateTag(
  value: string,
  options: {
    maxLength?: number
    existing?: string[]
    maxItems?: number
  } = {}
): string | null {
  const { maxLength, existing = [], maxItems } = options
  const lower = existing.map(e => e.toLowerCase())

  if (/<[^>]*>/.test(value))
    return "Only plain text is allowed"
  if (maxLength && value.length > maxLength)
    return "This entry is too long"
  if (value.length > 2 && [...value].every(c => c === value[0]))
    return "This doesn't look like a valid entry"
  if (lower.includes(value.toLowerCase()))
    return "This is already in the list"
  if (maxItems && existing.length >= maxItems)
    return "You've reached the limit"

  return null
}
