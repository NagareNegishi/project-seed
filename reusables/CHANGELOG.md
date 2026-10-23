# Changelog

What changed in `reusables/` each session, for anyone who already has an older
copy of this collection in another project. Newest entry first.

## How to use this if you already copied from here before

- **New** — wasn't here before. Safe to copy in fresh; nothing to reconcile.
- **Changed** — a file you may already have was fixed or gained a feature.
  Diff your copy against the current one; don't assume it's still current.
- **Restructured** — paths moved. If you copied by path (not just by file),
  update your notes.
- **Newly documented** — the file itself is unchanged; it just didn't have a
  `REUSABLES.md` row before. Nothing to re-copy, but worth knowing it was
  always there if you'd only skimmed the table.
- **Skipped** — considered and left out, with why. Saves you re-deriving the
  same analysis if you're wondering "why isn't X here."

## 2026-09-27

### Restructured

`reusables/` used to be frontend-only, with `util/`, `component/`, `shadcn/`,
and the dev harness (`package.json`, `tsconfig.json`, `vitest.*`) sitting
directly under `reusables/`. They all moved to `reusables/frontend/` — same
files, same relative layout, just one level deeper — to make room for
`reusables/backend/` (C#, new this session). **If you copied files using the
old flat paths, the content at those paths is unchanged, only relocated.**

### New — Frontend (TypeScript / React)

Zero domain coupling already, copied in verbatim:

- `frontend/util/`: `useFromLinkState.ts`, `useRemountableDialog.ts`,
  `useEntryList.ts`, `richText.tsx`
- `frontend/component/`: `LimitedTextarea.tsx`, `SectionHeader.tsx`,
  `table-plain.tsx`, `TimeSelect.tsx`, `CountryFlag.tsx`, `GateIndicator.tsx`,
  `CurrentCheckbox.tsx`, `BackButton.tsx`
- `frontend/shadcn/`: `textarea.tsx`, `tooltip.tsx`, `table.tsx` (deps pulled
  in for the above)

Generalized from a domain-coupled original (the domain-specific half was left
behind, not just renamed — check the "Needs" column in `REUSABLES.md` for what
each one still depends on):

- `jwtAuth.ts` ← the app's `auth.ts`. Kept the token store and a
  `getClaim`/`getRoles`/`hasRole` reader; dropped tier/demo-account checks.
- `maintenanceWindow.ts` ← the app's `maintenance.ts` (+ the window-check
  logic that actually lived in `api.ts`). Timezone/hours/label are now fields
  on a `MaintenanceWindow` object instead of module constants.
- `useEditableList.ts` ← the app's `useEditableJobList`/`useEditableStatusList`
  (two hooks merged into one). Persistence is now `onSave`/`onDelete`
  callbacks the caller supplies, not mutation hooks imported inside.
- `CreatableCombobox.tsx` ← the app's `LanguageCombobox.tsx`. Suggestions and
  max length are now props, not hardcoded data.
- `ProtectedRoute.tsx` ← the app's `ProtectedRoute.tsx`. Takes
  `isAuthenticated`/`redirectTo` as props instead of importing a token check
  and hardcoding `/login`.

### New — Backend (C#)

First backend content in this collection. Copied verbatim:

- `backend/Extensions/`: `StringExtensions.cs` (`NormalizeAuthenticatorCode`),
  `IdentityResultExtensions.cs` (`ToErrorMessage`)

Generalized from a domain-coupled original, same treatment as above:

- `ClaimsPrincipalExtensions.cs` ← the app's version. Kept `GetUserId`/
  `GetEmail`; dropped `Tier()`/`IsDemo()`.
- `ExpiryClock.cs` ← the app's `PurgeClock.cs`. Kept the anchor→expiry-date
  math and reminder-window check; the anchor itself ("max of two specific
  date fields") is now something the caller computes and passes in.
- `LlmJsonResponseHelper.cs` ← the app's `ClaudeResponseHelper.cs`. Same
  logic verbatim (JSON-block extraction + contract-key logging is
  provider-agnostic); only the type name and doc comment dropped the
  "Claude" branding.
- `TextReadabilityGate.cs` ← the app's `CvTextReadability.cs`. Same algorithm
  verbatim; the throw-a-domain-exception call site became a `Result` enum
  (`Readable`/`NoText`/`Unreadable`) so you decide what a rejection means.

Backend dev harness, also new: `backend/Reusables.Tests.csproj` — standalone
xUnit project (`net10.0`), not wired into any solution. SDK-style auto-globs
every `.cs` file under the project dir, so it compiles `Extensions/`/`Util/`
alongside its own test files with no explicit file list. 29 tests, `dotnet
test` from `reusables/backend/`. Needs `Microsoft.Extensions.Logging.Abstractions`
(10.0.5 — 10.0.0 downgrades against `Microsoft.Extensions.Identity.Core`'s own
dependency) and `Microsoft.Extensions.Identity.Core` (ships `IdentityResult`
as a plain NuGet package, no ASP.NET Core hosting needed) on top of the usual
`Microsoft.NET.Test.Sdk`/`xunit`/`xunit.runner.visualstudio`/`coverlet.collector`.

### Changed — fixes to files you may already have

Frontend copies that had drifted from their `frontend/src` originals, found by
diffing every already-documented file against its source (resynced):

- `dateFormat.ts` — gained `parseDateOnly`, `formatDate`, `formatDateTime`,
  `withPreservedTime`, `withTimeOfDay`.
- `IconToggle.tsx` — dropped the old segmented/divider styling.
- `DatePicker.tsx` — gained controlled open-on-select, a `className` prop,
  text truncation.
- `ConfirmDialog.tsx` — gained an optional `children` slot.
- `TagInput.tsx` — gained an explicit "+" add button and a "Press Enter to
  add" hint.
- `DeleteConfirmDialog.tsx` — had a flat-out broken import
  (`@/components/ui/ConfirmDialog`); fixed to the relative `./ConfirmDialog`
  the rest of the collection uses.
- `CountryCombobox.tsx` — now imports the new `CountryFlag` (see above)
  instead of carrying its own inline copy of the same component.

Backend files, found while writing their tests:

- `LlmJsonResponseHelper.cs` / `TextReadabilityGate.cs` — both used `ILogger`
  with no `using Microsoft.Extensions.Logging;`. Invisible in the real app
  (`Microsoft.NET.Sdk.Web` brings that namespace in implicitly) but a compile
  error the instant either file lands in a plain library/console project.
  Added the explicit `using` to both.

### Newly documented — no content change

31 frontend files existed in the collection with no `REUSABLES.md` row at
all (an earlier "2nd round" batch — freshly-authored generic pieces, not
copies of anything in the app, despite the doc's intro implying everything
here is a copy): `CopyButton`, `ErrorBoundary`, `FileDropzone`, `FormField`,
`PaginationBar`, `SearchInput`, `SortableHeader`, `Spinner`, `ThemeToggle`,
and 20 `util/` helpers/hooks (`apiError`, `arrayUtils`, `debounce`,
`downloadFile`, `formatNumber`, `pagedResult`, `relativeTime`, `result`,
`retry`, `safeJsonParse`, `stringUtils`, `useAsync`, `useCopyToClipboard`,
`useDebouncedValue`, `useIntersectionObserver`, `useInterval`,
`useKeyboardShortcut`, `useLocalStorage`, `useMediaQuery`,
`useOnClickOutside`). Plus one file (`PasswordInput.tsx`) that was missing a
row for no reason at all — a plain gap in an earlier pass. All 32 now have
rows; every file on disk in `frontend/util/`, `frontend/component/`, and
`frontend/shadcn/` has a matching entry, verified programmatically.

### Skipped — considered, left out

Backend files with domain logic but no reusable core beneath it:

- `GeoRestriction.cs` — hardcoded EU-27+GB country list for VAT purposes; the
  only "algorithm" is `HashSet.Contains`.
- `UsagePricing.cs` — hardcoded per-token pricing tied to this app's usage
  enum.
- `AiQuotaGate.cs` / `QuotaResults.cs` — wired directly to this app's quota
  service, tier claim, and error codes.
- `PolicyVersions.cs` — two date constants.

## 2026-09-27 (round 2)

Scanned the rest of `backend/` for reusable pieces beyond the first pass's
Extensions/Util sweep — this round covers `Services/`, `Program.cs`, and one
helper buried inside a larger domain-coupled class.

### New — Backend (C#)

First content in a new `reusables/backend/Services/` folder — the collection
previously only had `Extensions/`/`Util/` (static helpers); these are
instantiable classes with constructor-injected dependencies:

- `IPwnedPasswordClient.cs` / `PwnedPasswordClient.cs` — copied verbatim (HIBP
  k-anonymity breach lookup, fails open).
- `BreachedPasswordValidator.cs` ← the app's version, generalized: `TUser`
  in place of `ApplicationUser`, a plain `int` threshold in place of
  `AuthConfig`.
- `DailyUtcBackgroundService.cs` — new, not a copy of one file: extracted
  from three near-identical `BackgroundService` classes in the app
  (`AiUsageResetBackgroundService`, `InactivityLifecycleBackgroundService`,
  `RefreshTokenCleanupBackgroundService`) that each hand-rolled the same
  wait-for-fixed-UTC-hour loop around `Util.OffPeakSchedule`. Subclass and
  implement `RunAsync`.
- `GitHubReleaseClient.cs` ← the app's `DesktopReleaseService`, generalized:
  kept the fetch-and-cache shell, dropped the per-platform installer-filename
  matching (app-specific), added `owner`/`repo`/`cacheKey`/`cacheTtl` params
  so it isn't pinned to one repo.

New in `backend/Util/`:

- `EdgeCountryHeader.cs` ← the app's `CloudflareRequestCountryResolver`,
  generalized: takes the raw header string instead of an `HttpContext` (no
  ASP.NET Core dependency needed), and the "no signal" placeholder codes are
  a parameter instead of a Cloudflare-specific hardcode.
- `JwtBuilder.cs` ← the "one place it builds a signed HS256 JWT" helper
  pulled out of the app's `AuthTokenService` (`WriteJwt`), which is otherwise
  all refresh-token/tier-claim domain logic. Only the builder itself moved;
  claim selection stays the caller's job, same as in the app.

Test harness: `Reusables.Tests.csproj` gained `Microsoft.Extensions.Caching.Memory`,
`Microsoft.Extensions.Hosting.Abstractions`, `Microsoft.IdentityModel.Tokens`,
and `System.IdentityModel.Tokens.Jwt` (plus bumping `Microsoft.Extensions.Logging.Abstractions`
to 10.0.12 — `Caching.Memory` 10.0.12 pulled it in transitively and NuGet
flagged the older pin as a downgrade). 58 tests total, `dotnet test` from
`reusables/backend/`.

### Skipped — considered, left out

- Program.cs's global exception handler (walks the inner-exception chain for
  a `DbException` to tell a 503 from a generic 500) — a solid pattern but
  inline middleware, not a class; would need writing as an actual
  `IMiddleware`/handler type to be copyable, not just lifted.
- `RefreshTokenCleanupService`'s "load-then-remove expired rows" — trivial
  once known, and tied to a specific `DbSet<RefreshToken>`; only worth
  lifting if regeneralized over `DbSet<T>` plus an expiry selector.
- `FrontendUrlResolver` — the "resolve a trusted origin from a config
  allowlist instead of trusting the Host header" idea is reusable, but the
  file itself is thin and its config keys (`App:FrontendBaseUrl`,
  `App:AllowedFrontendOrigins`) are specific enough to this app that there
  wasn't a clean generalization worth the file.
