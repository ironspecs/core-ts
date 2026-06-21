#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

echo "[pre-push] ./scripts/check-dependency-versions.sh"
./scripts/check-dependency-versions.sh

echo "[pre-push] bun run lint"
bun run lint
