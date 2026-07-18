# Round 1: implementation order

## Status (2026-07-18)

Done:

- Test infra: `reusables/package.json` (vitest, jsdom, typescript, react,
  @testing-library/react — installed), `vitest.config.ts` (jsdom env),
  `tsconfig.json`, `.gitignore` (node_modules). `npm test` from `reusables/`.
- Phase 1 complete — entries 1–9, each with source + test in `util/`: result,
  safeJsonParse, retry, debounce (contains both debounce and throttle),
  arrayUtils, stringUtils, formatNumber (number/currency/compact/bytes),
  relativeTime, downloadFile (jsdom test stubs `URL.createObjectURL` /
  `revokeObjectURL`). Verified: `npm test` passes (9 files, 63 tests).
- Phase 2 complete — pagedResult (type + pageCount/hasPrevPage/hasNextPage,
  page is 1-based), apiError (ApiErrorBody contract + parseApiErrorBody;
  `apiFetch.ts` ApiError/throwApiError adapted to it, ApiError now carries
  optional code/fieldErrors).
- Phase 3 complete — entries 12–20, each with source + test in `util/`:
  useAsync, useDebouncedValue, useLocalStorage, useCopyToClipboard,
  useOnClickOutside (SuggestionInput refactored onto it, imported as
  `@/utils/useOnClickOutside`), useMediaQuery, useKeyboardShortcut
  (Escape fires even in inputs), useInterval (contains useTimeout),
  useIntersectionObserver. Tests stub matchMedia, navigator.clipboard,
  and IntersectionObserver. Verified: `npm test` passes (20 files,
  130 tests).

Not done:

- Phase 4 (entries 21–31), starting with Spinner / PageLoader (21).
- Uncommitted: phase 3 hooks + tests, the SuggestionInput refactor, and this
  doc's status update. Phases 1–2 are committed.

Conventions below are settled and in use — match the existing `util/` files.

All round-1 entries accepted (boxes ticked in `proposal.md`). Implement in the
order below. One entry = one work unit: source file + intro header + test file
where testable. `shadcn/` additions have no slot; pull one only when a phase-4
component needs it.

## Conventions for every entry

**Intro header** — first thing in the file, clearly marked as removable:

```ts
/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: <one line>
 * USE WHEN: <situations, one or two lines>
 * NOTES: <optional: when not to use, gotchas>
 * ─────────────────────────────────────────────────────────────── */
```

What and when only. No implementation detail. Written for someone seeing the
file for the first time.

**Standard docs** — normal JSDoc on exports, per
`.claude/skills/code-commenting/SKILL.md`. Kept separate from the intro so the
intro can be deleted without losing documentation.

**Tests** — `<name>.test.ts` / `.test.tsx` next to the source. Every pure TS
util and every hook gets one. Components: test when there is behavior (state,
validation, windowing logic); skip pure layout (Spinner, EmptyState,
FormField).

## Test infrastructure — settle before phase 1

The repo has no `package.json` anywhere. Proposed: a dev-only
`reusables/package.json` with vitest, @testing-library/react, and jsdom;
`node_modules` gitignored; run with `npm test` from `reusables/`. Consumers
still copy source files only, so "not part of any build" holds for them.

## Order

### Phase 1 — pure TS utils (`util/`)

1. **result** — first: safeJsonParse (2) and useAsync (12) build on it.
2. **safeJsonParse** — requires result; useLocalStorage (14) uses it.
3. **retry** — includes `sleep`.
4. **debounce / throttle**
5. **arrayUtils** — groupBy, chunk, uniqueBy.
6. **stringUtils** — slugify, truncate.
7. **formatNumber**
8. **relativeTime**
9. **downloadFile** — browser API; last of the utils, jsdom test.

### Phase 2 — shared contracts (`util/`)

10. **PagedResult\<T\>** — PaginationBar (29) pairs with it.
11. **API error contract** — type + adapt `apiFetch.ts` `throwApiError` to it.

### Phase 3 — hooks (`util/`)

12. **useAsync** — uses result.
13. **useDebouncedValue** — SearchInput (26) needs it.
14. **useLocalStorage** — uses safeJsonParse.
15. **useCopyToClipboard** — CopyButton (27) needs it.
16. **useOnClickOutside** — includes refactoring `SuggestionInput` onto it.
17. **useMediaQuery**
18. **useKeyboardShortcut**
19. **useInterval / useTimeout**
20. **useIntersectionObserver**

### Phase 4 — components (`component/`)

21. **Spinner / PageLoader**
22. **EmptyState**
23. **FormField**
24. **ErrorBoundary**
25. **PasswordInput**
26. **SearchInput** — requires 13.
27. **CopyButton** — requires 15.
28. **ThemeToggle** — wires existing `useTheme`; decide tri-state at
    implementation time.
29. **PaginationBar** — uses 10.
30. **SortableHeader**
31. **FileDropzone** — largest; last.
