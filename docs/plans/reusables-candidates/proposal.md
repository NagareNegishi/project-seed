# Reusables: candidate additions (round 1)

Proposal only, nothing implemented. Review entries one by one; check the box to
accept, strike or delete to reject. Entries marked `requires: X` build on
another entry, so rejecting X invalidates them. After the trim, round 2 can
explore the areas listed at the end.

Draft was reviewed by a second agent against the existing `reusables/` files;
overlap notes below come from that pass.

## Selection criteria

An entry qualifies when all hold:

- Needed in most projects, not just the current one.
- Zero dependencies, or only ones already accepted here: React, shadcn/ui
  primitives, Tailwind (via `cn`), lucide-react (already used by `IconToggle`
  and `ResponsiveButton`), and built-in web APIs (`Intl`, `crypto`,
  clipboard). No lodash, date-fns, axios, react-hook-form, or similar.
- Small enough to read and adapt in one sitting. Anything that tends to grow
  project-specific logic is scoped down or moved to "deliberately skipped".

## Folder structure

Current `component/`, `shadcn/`, `util/` stay. Hooks stay in `util/` too:
`useTheme` and `useScrollToNewItem` already live there, and the `use` prefix
separates them from pure TS well enough. A `hooks/` folder would strand or
force-move the existing two, for no gain.

Backend candidates: the backend language is not fixed, so no folder is
proposed yet. When the first piece lands, create `reusables/<lang>/` (e.g.
`cs/`, `py/`). The TS halves of those patterns can land in `util/` today and
are listed with checkboxes; the rest is recorded as intent only.

## Hooks (React, zero deps)

- [ ] **useDebouncedValue** — debounce a changing value. Search boxes and
  filter inputs need it in nearly every app; ~10 lines.
- [ ] **useLocalStorage** — `useState` persisted to localStorage with JSON
  and SSR guards. Theme, drafts, dismissed banners. `useTheme` inlines this
  pattern but has custom validation, so it stays as is.
- [ ] **useMediaQuery** — media-query match as state. For behavior CSS
  breakpoints can't express (conditional rendering, different components per
  size). Complements the existing `ResponsiveButton`.
- [ ] **useOnClickOutside** — dismiss on outside click. Any hand-rolled
  dropdown, popover, or menu needs it. `SuggestionInput` currently inlines
  this; accepting means refactoring it onto the hook so there aren't two
  copies.
- [ ] **useAsync** — `{ data, error, loading }` state machine around a
  promise, with stale-response guard. Pairs with the existing `apiFetch`;
  removes the three-useState boilerplate every fetch call repeats.
- [ ] **useCopyToClipboard** — copy with a self-resetting `copied` flag.
  Backs CopyButton below.
- [ ] **useKeyboardShortcut** — bind a key combo with proper cleanup and
  input-focus guard. Modals (Esc), forms (Ctrl+Enter), palettes (Ctrl+K).
- [ ] **useInterval / useTimeout** — ref-based versions that survive
  re-renders without stale closures. Deceptively hard to write correctly;
  polling UIs and auto-dismiss toasts need them.
- [ ] **useIntersectionObserver** — "is this element on screen" as state.
  Lazy loading, infinite-scroll triggers, scroll-linked effects.

## Pure TS (`util/`, framework-free)

- [ ] **retry** — async retry with exponential backoff and cap; includes
  `sleep`. Useful on both fetch calls and Node scripts.
- [ ] **result** — `Result<T, E>` type with `ok`/`err` helpers. Borderline
  small, kept because `safeJsonParse` and `useAsync` build on it. If
  rejected, `safeJsonParse` returns a fallback value instead.
- [ ] **arrayUtils** — `groupBy`, `chunk`, `uniqueBy`. The three lodash
  functions actually reached for; each a few lines with native code.
- [ ] **formatNumber** — number, currency, bytes, compact ("1.2k") via
  `Intl.NumberFormat`. Zero deps, locale-correct.
- [ ] **relativeTime** — "3 days ago" via `Intl.RelativeTimeFormat`. The
  usual reason date-fns gets installed; pairs with existing `dateFormat`.
- [ ] **stringUtils** — `slugify`, `truncate` (with ellipsis). Small, needed
  constantly, annoying to rewrite correctly (unicode, edge cases).
- [ ] **safeJsonParse** — typed no-throw JSON parse. `requires: result` (or
  reword to return a fallback). Every localStorage/API-response read wants it.
- [ ] **debounce / throttle** — plain-function versions for non-React call
  sites: scroll handlers, resize, Node scripts. Recommended keep;
  `useDebouncedValue` only covers the React case.
- [ ] **downloadFile** — blob to `createObjectURL`, click, revoke. The
  classic look-it-up-every-time util; pairs with CSV/JSON exports.

## Components

- [ ] **EmptyState** — icon + message + optional action slot. Every list and
  search view needs one; hand-rolled differently each time.
- [ ] **ErrorBoundary** — class boundary + default fallback with retry.
  Every SPA needs one and React ships none.
- [ ] **Spinner / PageLoader** — inline spinner and a centered full-area
  variant. Trivial but reused constantly; standardizes size and color.
- [ ] **FormField** — label + input slot + error text layout. Form
  orchestration is deferred (see skipped list), but this presentational row
  is rewritten in every form and is pure layout.
- [ ] **SearchInput** — debounced input with clear button.
  `requires: useDebouncedValue`; builds on the shadcn input.
- [ ] **PaginationBar** — prev/next + page numbers with ellipsis. The
  page-number windowing logic is the part worth keeping.
- [ ] **SortableHeader** — table header cell owning sort state, aria
  attributes, and direction indicator. The reusable kernel of a data table;
  the table itself stays per-project (see skipped list).
- [ ] **CopyButton** — button with check-mark feedback.
  `requires: useCopyToClipboard`. Code blocks, API keys, share links.
- [ ] **ThemeToggle** — light/dark toggle wired to the existing `useTheme`
  (which is two-state; OS preference is read once at init). Optionally extend
  the hook to tri-state light/dark/system as part of this entry.
- [ ] **PasswordInput** — shadcn input with show/hide toggle. Every auth
  form.
- [ ] **FileDropzone** — drag-and-drop file input with type/size validation,
  no library. Scoped to selection + validation only; preview and upload logic
  go project-specific.

## shadcn/ additions

Low review cost, pull as needed rather than debating each: `textarea`,
`tooltip`, `skeleton`, `tabs`, `dropdown-menu`, `sonner` (toasts — note this
one wraps the third-party `sonner` npm package, unlike the radix-based
primitives; accept deliberately). Listed so round 1 records the intent;
adding one is a copy from the shadcn CLI output.

## Backend patterns

TS halves that can land in `util/` now:

- [ ] **`PagedResult<T>`** — pagination envelope type (items, total, page,
  size) as the shared frontend/backend contract. Pairs with PaginationBar.
- [ ] **API error contract** — one error shape (problem-details style: code,
  message, field errors) as a type. The frontend parser half already exists
  (`apiFetch.ts` `throwApiError` handles `{message}`, identity-error arrays,
  bare strings); this entry means settling the contract and adapting that
  parser to it, not writing a new one.

Intent only, no checkbox — folder and language wait for the backend stack:

- **TTL cache** — tiny in-memory cache with expiry, ~30 lines. Config
  lookups, token caching, anything too small for Redis.
- **Env config loader** — read env vars into a typed config object, fail
  fast on missing keys. Backend-side pattern per language; frontend (Vite)
  env is compile-time and not shared with it.

## Deliberately skipped (round 2 candidates)

- Form state / validation orchestration — react-hook-form + zod do it
  better; a hand-rolled version violates the "small" rule.
- DataTable — high value but generic tables grow sorting, selection, and
  virtualization until they become a library. SortableHeader above keeps the
  reusable kernel.
- Auth helpers (token storage, refresh flow) — too coupled to the auth
  provider to be portable yet. Revisit once two projects share a flow.
- Charts, virtualized lists, rich text — real library territory.
- Test utilities — worth its own round once the test stack in CLAUDE.md is
  filled in.
