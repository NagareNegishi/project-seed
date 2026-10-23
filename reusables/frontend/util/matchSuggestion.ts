// Suggestion-matching strategies for autocomplete inputs.
export type MatchStrategy = "prefix" | "word-start" | "substring"

export function matchesSuggestion(suggestion: string, query: string, strategy: MatchStrategy): boolean {
  const s = suggestion.toLowerCase()
  const q = query.toLowerCase()
  switch (strategy) {
    case "prefix":
      return s.startsWith(q)
    case "word-start": {
      const queryWords = q.trim().split(/\s+/)
      const suggWords = s.split(/\s+/)
      return suggWords.some((_, start) =>
        queryWords.every((qw, j) => (suggWords[start + j] ?? "").startsWith(qw))
      )
    }
    case "substring":
      return s.includes(q)
  }
}
