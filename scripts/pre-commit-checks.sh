#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

echo "[pre-commit] ./scripts/check-dependency-versions.sh"
./scripts/check-dependency-versions.sh
