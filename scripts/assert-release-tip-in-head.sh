#!/usr/bin/env bash
set -euo pipefail

release_ref=${1:?release ref is required}
checked_ref=${2:?checked ref is required}

release_sha=$(git rev-parse "$release_ref")
checked_sha=$(git rev-parse "$checked_ref")

if ! git merge-base --is-ancestor "$release_sha" "$checked_sha"; then
  echo "Checked commit $checked_sha does not include release tip $release_sha from $release_ref" >&2
  exit 1
fi
