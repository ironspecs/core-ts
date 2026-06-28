#!/usr/bin/env bash
set -euo pipefail

ancestor_ref=${1:?ancestor ref is required}
descendant_ref=${2:?descendant ref is required}

ancestor_sha=$(git rev-parse "$ancestor_ref")
descendant_sha=$(git rev-parse "$descendant_ref")

if ! git merge-base --is-ancestor "$ancestor_sha" "$descendant_sha"; then
  echo "$ancestor_ref ($ancestor_sha) is not an ancestor of $descendant_ref ($descendant_sha)" >&2
  exit 1
fi
