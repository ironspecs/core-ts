#!/usr/bin/env bash
set -euo pipefail

release_root=${1:?release artifact directory is required}
current_root=${2:?current repository directory is required}

packages=(
  react
  react-i18n
  react-progression
  react-form-builder
)

work_dir=$(mktemp -d)
release_dts="$work_dir/release-dts"
current_dts="$work_dir/current-dts"

copy_dts_files() {
  local source_root=$1
  local target_root=$2

  mkdir -p "$target_root"

  for package_name in "${packages[@]}"; do
    local package_dist="$source_root/$package_name/dist"
    local found_dts=0

    if [[ ! -d "$package_dist" ]]; then
      echo "Missing dist directory: $package_dist" >&2
      exit 1
    fi

    while IFS= read -r file; do
      local relative_file=${file#"$source_root"/}

      mkdir -p "$target_root/$(dirname "$relative_file")"
      cp "$file" "$target_root/$relative_file"
      found_dts=1
    done < <(find -P "$package_dist" -type f -name '*.d.ts' | sort)

    if [[ "$found_dts" -ne 1 ]]; then
      echo "No declaration files found in: $package_dist" >&2
      exit 1
    fi
  done
}

copy_dts_files "$release_root" "$release_dts"
copy_dts_files "$current_root" "$current_dts"

diff -ru "$release_dts" "$current_dts"
