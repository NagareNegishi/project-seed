# Example: Browser extension (Manifest V3, esbuild)

**Not a dev-container stack.** The other folders under `examples/` are
`.devcontainer/` setups you merge into the seed. This one is a build-tooling
reference for adding a browser-extension component *alongside* an existing
web app — there's nothing here to merge into `.devcontainer/`, and no
placeholder markers to fill.

Kajitor's real extension build (`extension/` in that repo, sitting next to its
`backend/` and `frontend/`), with every project-specific value swapped for a
`<placeholder>` token — unlike the devcontainer examples above, which keep
the source project's real values in place. Use it as a starting point if a
project needs a Chrome/Firefox extension that talks to its own web app:

- `package.json` — `tsc --noEmit` for typechecking (no bundling), `esbuild`
  for the actual build, `vitest` for tests. Separate `build`, `build:store`,
  `build:prod-local`, `build:firefox`, and `watch` scripts.
- `tsconfig.json` — `@types/chrome`, `noEmit: true` (esbuild transpiles,
  tsc only checks), `erasableSyntaxOnly` for the TS 7/Go-port compiler.
- `manifest.json` — MV3 dev manifest: pinned `key` (keeps the extension ID
  stable across unpacked reloads), dev + prod entries side by side in
  `host_permissions` and `externally_connectable`.
- `scripts/build.mjs` — esbuild entry points for background/popup/content
  scripts, copies static assets (manifest, popup HTML, icons), zips store
  builds.
- `scripts/storeManifest.mjs` — strips dev-only hosts and the pinned `key`
  for store submissions; a separate Firefox variant (event page instead of
  service worker, AMO's `browser_specific_settings`, no
  `externally_connectable` since Firefox doesn't support it).

## Placeholders to fill in

| Token | Where | Fill with |
|---|---|---|
| `<project>` / `<Project Name>` | `package.json` name, `manifest.json` name/icon filenames, `build.mjs` zip names and asset paths, `storeManifest.mjs` gecko id | your project's name/slug |
| `<your-domain>` | `manifest.json` host_permissions/externally_connectable, `storeManifest.mjs` gecko id | the domain your web app and API live on |
| `<backend-port>` / `<frontend-port>` | `manifest.json` host_permissions/externally_connectable | your dev backend/frontend ports |
| `<unpacked-dev-key>` | `manifest.json` key | generate your own (load the unpacked extension once without `key`, Chrome prints one in `chrome://extensions`, pin it so the ID stays stable across reloads) |
| `<One-line description...>` | `manifest.json` description | what the extension does |

`build.mjs`'s `../assets/brand/` icon paths assume a sibling shared-assets
folder — adjust to wherever your project keeps brand assets, or inline them
under `extension/`.
