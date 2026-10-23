# Reusable pieces

A catalog of the project-agnostic functions and components collected under
`reusables/`, organized by language since each has its own copy-in steps.
Nothing here is wired into any build — these are files to copy into a new
project, not a package to depend on.

- **[Frontend (TypeScript / React)](#frontend-typescript--react)** — `reusables/frontend/`
- **[Backend (C#)](#backend-c)** — `reusables/backend/`

## Frontend (TypeScript / React)

### To reuse a piece

Copy its file, then pull in whatever it depends on (the "Needs" column). Two
kinds of dependency:

- **shadcn/ui** primitives (`button`, `input`, `dialog`, `calendar`, `popover`,
  `checkbox`, `label`, `select`, `command`, `textarea`, `tooltip`, `table`) are
  bundled under `frontend/shadcn/` — copy those too, or re-add a fresh one with
  `npx shadcn@latest add <name>`.
- **In-collection** deps are other rows in these tables; grab them too.

Import paths in the copies use the `@/` alias (`@/lib/utils`,
`@/components/ui/...`, `@/utils/...`) — repoint them to wherever the files
land in the target project.

### frontend/util/

| File | What it does | Needs |
|---|---|---|
| `cn.ts` | Merge Tailwind class strings with conflict resolution (the shadcn `cn` helper). | `clsx`, `tailwind-merge` |
| `dateFormat.ts` | Human-readable date fragments, e.g. `formatMonthYear(2021, 3)` → "Mar 2021". | — |
| `dateValidation.ts` | `checkDateOrder` / `checkNotFuture` — validate a from→to range at year/month/day granularity; returns an error string or null. | — |
| `matchSuggestion.ts` | `matchesSuggestion(suggestion, query, strategy)` for autocomplete — `prefix` / `word-start` / `substring`. | — |
| `scoreColor.ts` | Map a 0–100 score to a perceptually uniform OKLCH colour (fixed L/C, hue sweeps red→green). | — |
| `validateTag.ts` | Validate a tag/free-text entry (length, duplicates, max count, rejects HTML); returns an error string or null. | — |
| `useScrollToNewItem.ts` | Hook: smooth-scroll a newly appended list item into view. Attach `lastItemRef`, call `requestScroll()` before appending. | `react` |
| `useTheme.ts` | Hook: light/dark + colour-theme state persisted to `localStorage`, falling back to OS preference. Colour-theme list is app-editable. | `react` |
| `apiFetch.ts` | `createApiClient(config)` → an authed fetch that attaches a Bearer token, sends cookies, and on 401 does a single-flight refresh + one retry; plus `ApiError` / `handleResponse` / `handleEmptyResponse`. Refresh endpoint + session-expiry callback are config. | — |
| `useFromLinkState.ts` | Hook: spread onto a `Link`'s props so the page it points to can navigate back to wherever it was clicked from. Pairs with component `BackButton`. | `react-router` |
| `useRemountableDialog.ts` | Hook: `open`/`key` pair for a dialog whose form state should reset via remount (not a `useEffect`) each time it's opened. | `react` |
| `useEntryList.ts` | Hook: add/update/remove machinery for a multi-entry array field, plus a header-add flow that opens edit mode and scrolls the new entry into view. | `react`; util `useScrollToNewItem` |
| `richText.tsx` | `renderBoldText(text)` — renders `**bold**` segments in a plain string as `<strong>`, for copy stored as config strings. | `react` |
| `jwtAuth.ts` | In-memory access-token store (`getToken`/`setToken`/`clearToken`) + `getClaim`/`getRoles`/`hasRole` reading a JWT's payload. | — |
| `maintenanceWindow.ts` | `isWithinWindow(window)` — true when now, in `window.timezone`, falls in a start/end hour range (handles a range crossing midnight); `formatWindowLabel(window)` for display. | — |
| `useEditableList.ts` | Add/edit/delete-confirm state machine for an array field; caller supplies `onSave`/`onDelete` instead of the hook owning specific mutations. | `react`; util `useRemountableDialog` |
| `apiError.ts` | `ApiErrorBody`/`ParsedApiError` contract + `parseApiErrorBody(body)` — tolerant parser for an error response body (message/code/fieldErrors); also understands legacy shapes (an Identity-style error array, a bare string body). | — |
| `arrayUtils.ts` | `groupBy` / `chunk` / `uniqueBy` — the three lodash array helpers most apps actually reach for. Non-mutating, order-preserving. | — |
| `debounce.ts` | `debounce(fn, wait)` / `throttle(fn, wait)` for plain functions (outside React); both return a wrapper with a `.cancel()`. | — |
| `downloadFile.ts` | `downloadFile(content, filename, mimeType?)` — triggers a browser download of in-memory `Blob`/string via a temporary object URL. | — |
| `formatNumber.ts` | `formatNumber` / `formatCurrency` / `formatCompact` / `formatBytes` — locale-aware number formatting via `Intl.NumberFormat`. | — |
| `pagedResult.ts` | `PagedResult<T>` envelope type + `pageCount` / `hasPrevPage` / `hasNextPage` paging-math helpers. Pairs with component `PaginationBar`. | — |
| `relativeTime.ts` | `relativeTime(date, options?)` — "3 days ago" / "in 2 hours" via `Intl.RelativeTimeFormat`; pass `now` for stable output in tests. | — |
| `result.ts` | `Result<T, E>` — a return value that's explicitly a success or a typed failure, for errors a caller should handle instead of catching. | — |
| `retry.ts` | `retry(fn, options?)` — reruns a failing async function with exponential backoff; also exports the `sleep(ms)` it's built on. | — |
| `safeJsonParse.ts` | `safeJsonParse` / `safeJsonParseOr` — `JSON.parse` that returns a `Result` (or a fallback) instead of throwing. | util `result` |
| `stringUtils.ts` | `slugify(text)` + `truncate(text, maxLength)` — grapheme-safe truncation via `Intl.Segmenter`, so emoji/accents never get split. | — |
| `useAsync.ts` | Hook: runs an async function and returns `loading` + the last run's `Result`; stale/superseded runs are dropped. | `react`; util `result` |
| `useCopyToClipboard.ts` | Hook: `copy(text)` + a self-resetting `copied` flag for "Copied!" feedback. Powers component `CopyButton`. | `react` |
| `useDebouncedValue.ts` | Hook: a copy of a value that only updates after `delayMs` of quiet — debounces a value, not a function. | `react` |
| `useIntersectionObserver.ts` | Hook: the latest `IntersectionObserverEntry` for a ref's element; optional `once` to stop observing after the first intersect. | `react` |
| `useInterval.ts` | Hooks: `useInterval` / `useTimeout` — declarative `setInterval`/`setTimeout` with automatic cleanup; `null` delay pauses. | `react` |
| `useKeyboardShortcut.ts` | Hook: binds a handler to a key + exact modifiers, document-wide; skips typing targets (input/textarea/contenteditable) unless `allowInInputs`. | `react` |
| `useLocalStorage.ts` | Hook: `useState` persisted to `localStorage` as JSON, kept in sync across tabs via the `storage` event. | `react`; util `safeJsonParse` |
| `useMediaQuery.ts` | Hook: a boolean tracking whether a CSS media query currently matches, updating live. | `react` |
| `useOnClickOutside.ts` | Hook: runs a handler on mousedown/touchstart outside a ref's element. Powers component `SuggestionInput`. | `react` |

### frontend/component/

| File | What it does | Needs |
|---|---|---|
| `UnderlinedText.tsx` | Text with a styled underline accent. | — |
| `ScoreRing.tsx` | Circular 0–100 progress ring coloured by the score. | util `scoreColor` |
| `ResponsiveButton.tsx` | Button showing label + icon on wide screens, icon-only when narrow. | shadcn `button` |
| `FormActionBar.tsx` | Save/Cancel action row for forms, with dirty/saving states. | shadcn `button`; util `cn` |
| `IconToggle.tsx` | Two-state icon toggle button. | shadcn `button`; util `cn` |
| `EntryRow.tsx` | Bordered row wrapper with a trailing delete button, plus an `AddEntryButton` footer button — for editable list-of-entries UIs. | shadcn `button`; util `cn` |
| `CheckboxGroup.tsx` | A labelled group of checkboxes over an option list. | shadcn `checkbox`, `label` |
| `ConfirmDialog.tsx` | Generic confirm/cancel modal. | shadcn `button`, `dialog` |
| `DeleteConfirmDialog.tsx` | Destructive-action confirm modal (delete styling). | util `cn`; in-collection `ConfirmDialog` |
| `DatePicker.tsx` | Popover calendar date picker. | shadcn `button`, `calendar`, `popover`; util `cn` |
| `SuggestionInput.tsx` | Text input with an autocomplete suggestion dropdown. | shadcn `input`; util `cn`, `matchSuggestion` |
| `TagInput.tsx` | Tag/chip input: type-and-enter, validation, optional suggestions. | util `matchSuggestion`, `validateTag` |
| `MonthSelect.tsx` | Month dropdown (`null` = unselected; month is optional). | shadcn `select` |
| `YearSelect.tsx` | Year dropdown, 1900→current descending (`0` = unselected sentinel). | shadcn `select` |
| `MonthYearPicker.tsx` | Labelled month + year row (month optional, year required). | in-collection `MonthSelect`, `YearSelect`; shadcn `label` |
| `CountryCombobox.tsx` | Searchable ISO-country picker with flags and an `excludeCodes` prop. Needs the `flag-icons` CSS import for flags. | in-collection `countryCodes`, `CountryFlag`; shadcn `button`, `command`, `popover`; util `cn`; npm `flag-icons` |
| `countryCodes.ts` | ISO alpha-2 country list + `getCountryName` (via `Intl.DisplayNames`), sorted by display name. | — |
| `InlineEditCard.tsx` | LinkedIn-style titled card: read-only view + pencil, swaps to an edit form in place, Save/Cancel footer, empty-state placeholder, optional add (+). Also exports `ViewChips`. | shadcn `button` |
| `LimitedTextarea.tsx` | Labelled textarea with a hard character cap; handles paste manually so a paste that would overflow gets trimmed instead of silently dropped, with a "trimmed" note. | shadcn `label`, `textarea` |
| `SectionHeader.tsx` | A section's title on the left, action(s) on the right — the header row above a list/tab body. | — |
| `table-plain.tsx` | Variant of shadcn `table`'s `Table` wrapper with `overflow-x-auto` removed, for a parent that already provides a bounded scroll container. Pair with the rest of shadcn `table`'s exports (`TableHeader`/`TableBody`/etc). | shadcn `table` |
| `TimeSelect.tsx` | Dropdown of 15-minute time-of-day slots, in place of a native `<input type="time">` (inconsistent segmented editing across browsers). | shadcn `select`; util `dateFormat` (`withTimeOfDay`) |
| `CountryFlag.tsx` | Flag icon for an ISO country code, via the `flag-icons` sprite. | npm `flag-icons` |
| `GateIndicator.tsx` | Small icon that only renders when a `tooltip` string is given — for "this field unlocks something else" hints. | shadcn `tooltip` |
| `CurrentCheckbox.tsx` | Checkbox + label row for an "is current / ongoing" toggle. | shadcn `checkbox`, `label` |
| `BackButton.tsx` | "← Back" to wherever `useFromLinkState` recorded as the caller's path, falling back to a fixed route for a direct visit. | `react-router`; util `useFromLinkState` |
| `CreatableCombobox.tsx` | Pick from a `suggestions` list, or type a value with no match and commit it via an "Add …" item; free text always allowed within an optional `maxLength`. | shadcn `button`, `command`, `popover`; util `cn` |
| `ProtectedRoute.tsx` | Auth-gate for a route tree: renders `children` when `isAuthenticated`, else redirects (history-replace) to `redirectTo`. | `react-router` |
| `CopyButton.tsx` | Icon button that copies `text` to the clipboard and flashes a check mark as feedback. | shadcn `button`; util `useCopyToClipboard` |
| `EmptyState.tsx` | Centered icon + title + description + action slot, for empty lists and no-result views. | util `cn` |
| `ErrorBoundary.tsx` | Class error boundary with a default retryable fallback; catches render/lifecycle errors below it (not event handlers or async code). | shadcn `button` |
| `FileDropzone.tsx` | Drag-and-drop / click-to-browse file picker with type and size validation, no library. Also exports `isAcceptedType`. Selection + validation only — previews/upload stay in the app. | util `cn` |
| `FormField.tsx` | Labelled form row: label, control slot, error-or-hint text. Layout only, no form state. | shadcn `label`; util `cn` |
| `PasswordInput.tsx` | Password field with a trailing show/hide visibility toggle. Accepts all `input` props except `type`, which the toggle owns. | shadcn `button`, `input`; util `cn` |
| `PaginationBar.tsx` | Prev/next + windowed page-number buttons with ellipsis for a `PagedResult`; renders nothing for a single page. Also exports the `getPageItems` windowing helper. | shadcn `button`; util `cn`, `pagedResult` |
| `SearchInput.tsx` | Uncontrolled search box that fires `onSearch` after typing settles, with a clear button (fires immediately). | shadcn `button`, `input`; util `cn`, `useDebouncedValue` |
| `SortableHeader.tsx` | `<th>` cell owning the sort indicator, `aria-sort`, and click-to-sort for one column. Also exports the `SortState` type. | util `cn` |
| `Spinner.tsx` | Inline spinning loader icon, plus `PageLoader` — the centered full-area variant with an optional label. | util `cn` |
| `ThemeToggle.tsx` | Sun/moon button that flips light/dark mode via `useTheme`. | shadcn `button`; util `useTheme` |

### frontend/shadcn/

Stock [shadcn/ui](https://ui.shadcn.com) primitives, included only because the
components above depend on them. Each also depends on `cn` (in `util/`). These
are third-party generated, not authored here — prefer `npx shadcn@latest add
<name>` in a fresh project and use these copies as a version reference. Built
against `radix-ui@1.5`, `react-day-picker@9`, `class-variance-authority@0.7`.

| File | npm deps |
|---|---|
| `button.tsx` | `radix-ui`, `class-variance-authority` |
| `input.tsx` | — |
| `label.tsx` | `radix-ui` |
| `checkbox.tsx` | `radix-ui` |
| `dialog.tsx` | `radix-ui` (+ in-collection `button`) |
| `popover.tsx` | `radix-ui` |
| `calendar.tsx` | `react-day-picker` (+ in-collection `button`) |
| `select.tsx` | `radix-ui` |
| `command.tsx` | `cmdk` (+ in-collection `dialog`) |
| `textarea.tsx` | — |
| `tooltip.tsx` | `radix-ui` |
| `table.tsx` | — |

## Backend (C#)

### To reuse a piece

Copy the file, keep the namespace or rename it to match your project, and pull
in whatever it depends on (the "Needs" column — all framework/BCL, no third-party
NuGet packages beyond what "Needs" lists).

### Running the tests

`reusables/backend/Reusables.Tests.csproj` is a standalone xUnit project that
compiles every file in `Extensions/`/`Util/`/`Services/` alongside its own
`*Tests.cs` files — SDK-style projects glob all `.cs` files under the project
directory by default, so nothing needs listing explicitly.

```bash
cd reusables/backend
dotnet test
```

### backend/Extensions/

| File | What it does | Needs |
|---|---|---|
| `StringExtensions.cs` | `NormalizeAuthenticatorCode()` — strips spaces/hyphens from a pasted code. | — |
| `IdentityResultExtensions.cs` | `ToErrorMessage()` — joins ASP.NET Identity's per-error descriptions into one string. | `Microsoft.AspNetCore.Identity` |
| `ClaimsPrincipalExtensions.cs` | `GetUserId()` / `GetEmail()` reading the standard `sub`/email claims. | `System.Security.Claims` |

### backend/Util/

| File | What it does | Needs |
|---|---|---|
| `OffPeakSchedule.cs` | `NextOccurrenceUtc(nowUtc, hourUtc)` — next occurrence of a daily job pinned to a fixed UTC hour. | — |
| `ExpiryClock.cs` | `ComputeExpiryDate(anchor, monthsUntilExpiry)` + `IsInReminderWindow(expiryDate, today, reminderWindowDays)`. Compute your own anchor and pass it in. | — |
| `LlmJsonResponseHelper.cs` | `ExtractJson(raw, logger, context)` pulls the first `{ }` block out of a text-completion response that wrapped it in prose; `LogContractIssues` + `GetKnownKeys<T>()` log unexpected/null keys against a DTO's `[JsonPropertyName]`s. | `Microsoft.Extensions.Logging` |
| `TextReadabilityGate.cs` | `CheckReadability(pages, logger)` — Unicode-composition gate (private-use codepoints, replacement chars, control chars, run length, whitespace/letter ratios) that flags text a PDF/OCR pipeline decoded into garbage, aggregated by character mass across pages. Returns a `Result` enum instead of throwing. | `Microsoft.Extensions.Logging` |
| `EdgeCountryHeader.cs` | `Parse(headerValue, noSignalCodes?)` — validates a 2-letter ISO country code out of an edge-CDN header value, filtering out "no signal" placeholders (defaults to Cloudflare's `XX`/`T1`; pass your own provider's). Takes the raw header string instead of an `HttpContext` — pull the header yourself. | — |
| `JwtBuilder.cs` | `Write(signingKey, issuer, audience, claims, lifetime)` — builds one signed HS256 JWT. Claim selection, audience, and lifetime are all caller-supplied. | `Microsoft.IdentityModel.Tokens`, `System.IdentityModel.Tokens.Jwt` |

### backend/Services/

| File | What it does | Needs |
|---|---|---|
| `IPwnedPasswordClient.cs` / `PwnedPasswordClient.cs` | HIBP Pwned Passwords range-API client — SHA-1s a password, sends only the 5-char prefix (k-anonymity), matches the suffix against the response. Free, keyless. Fails open (returns 0 on any error). Register with base address `https://api.pwnedpasswords.com/` via `AddHttpClient`. | `Microsoft.Extensions.Logging` |
| `BreachedPasswordValidator.cs` | `IPasswordValidator<TUser>` that fails a password whose `IPwnedPasswordClient` breach count meets a caller-supplied threshold. Wire into ASP.NET Identity to cover create/change/reset password in one registration. | `Microsoft.AspNetCore.Identity` (ships in `Microsoft.Extensions.Identity.Core`, no ASP.NET Core hosting needed); in-collection `IPwnedPasswordClient` |
| `DailyUtcBackgroundService.cs` | Abstract `BackgroundService`: wakes once daily at a fixed UTC hour, runs your `RunAsync`, catches and logs an exception from it so the next day's run still happens. | `Microsoft.Extensions.Hosting.Abstractions`; util `OffPeakSchedule` |
| `GitHubReleaseClient.cs` | `GetLatestReleaseAsync(owner, repo, cacheKey, cacheTtl)` — fetches the latest GitHub release via the public Releases API, cached with `IMemoryCache`. Per-platform asset picking is app-specific — read `GitHubRelease.Assets` yourself. | `Microsoft.Extensions.Caching.Memory`, `Microsoft.Extensions.Logging` |
