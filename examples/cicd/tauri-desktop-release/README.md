# Example: Tauri desktop app, cross-platform release

job-tracker-desktop's real release pipeline, unmodified. A different genre
from the other `cicd/` folders — this isn't "deploy to a server," it's
building and publishing signed installers for Windows/macOS/Linux plus a
Flatpak, from one Tauri (Rust + web frontend) codebase. There's no
PR-check/test-gate workflow in the source repo at all — this folder is
release automation only; pair it with a `pr-checks.yml` from one of the
other `cicd/` folders if you want a merge gate too.

All workflows are `workflow_dispatch`-only (manual), not wired to push/PR —
each was built to close a specific cross-compile verification gap (Tauri
can't cross-compile a Windows or macOS target from a Linux devcontainer, so
CI is the only place those builds can run at all).

- `release.yml` — the real "build and publish everything at once" workflow:
  `build-windows` → `build-macos` → `build-linux` → `publish` (one GitHub
  Release with every platform's installer attached, plus a merged
  `latest.json` for the Tauri updater).
- `build-windows.yml`, `release-windows.yml`, `release-macos.yml`,
  `release-macos-apple-silicon.yml`, `release-linux.yml` — single-platform
  splits of the same build, for verifying one platform's path without
  paying for a full multi-OS run. `release-macos.yml` builds a universal
  binary (`--target universal-apple-darwin`); `release-macos-apple-silicon.yml`
  is the arm64-only version it was copied from, kept as a reference/fallback.
  Windows and macOS both write into a shared `latest.json`, so each
  downloads whatever version already exists on the release and merges its
  own platform entry in rather than overwriting.
- `flatpak-build.yml` — runs `flatpak-builder` against the repo's Flatpak
  manifest. Can't run inside a devcontainer (needs bubblewrap, which needs
  unprivileged user namespaces the devcontainer doesn't have).
- `flatpak-demo-video.yml` — records a video of the built Flatpak running
  under a virtual display, for a Flathub submission's required demo video.
  Self-contained (builds its own copy rather than depending on another
  workflow's artifact).

Shared build pattern across the platform workflows: `actions/cache` keyed
on a pinned `tauri-cli` version for the cargo-bin cache (so a version bump
invalidates it instead of silently reusing a stale binary) and on
`Cargo.lock`'s hash for the registry/target-dir cache; `CARGO_TARGET_DIR`
overridden via env var because the checked-in `src-tauri/.cargo/config.toml`
points at a devcontainer-only path.

Secrets referenced: `TAURI_SIGNING_PRIVATE_KEY` + `_PASSWORD` (Tauri
updater's own signing keypair — not Apple notarization; there's no
`APPLE_ID`/notarization step here), `RELEASES_REPO_TOKEN` (pushes the
release to a separate public releases repo — the Tauri updater pattern of
keeping release artifacts out of the main source repo).

Project-specific values still inside these files: the artifact name
(`jobtracker-windows-installers`), frontend directory (`job-tracker-ui`),
pinned `tauri-cli` version (`2.11.4` — match whatever your
`.devcontainer/Dockerfile` pins), and the Flatpak app id
(`com.nagarenegishi.jobtracker`). Replace them when instantiating.
