#!/usr/bin/env bash
# Runs from postCreateCommand. Named volumes mounted over node_modules start
# root-owned, so give them to this user, then npm ci only where a volume is empty.
set -euo pipefail

# Repo root, derived from this script's location (.devcontainer/..).
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Must match the node_modules volume mounts in devcontainer.json.
# email-renderer first: apps/<app-2> and the email worker depend on it.
dirs=(packages/email-renderer apps/platform apps/<app-2> services/email-worker)

for d in "${dirs[@]}"; do
  nm="$root/$d/node_modules"
  if [ "$(stat -c %U "$nm")" != "$(id -un)" ]; then
    sudo chown "$(id -un):$(id -gn)" "$nm"
  fi
done

for d in "${dirs[@]}"; do
  # npm writes .package-lock.json when an install completes.
  if [ ! -f "$root/$d/node_modules/.package-lock.json" ]; then
    echo "Installing dependencies in $d"
    npm --prefix "$root/$d" ci
  fi
done
