#!/bin/sh
#
# This script checks for dependency version mismatches across a monorepo.
# It scans package.json files within all directories up to two levels deep.
#
# USAGE:
#   ./scripts/check-dependency-versions.sh
#
# EXIT CODES:
#   0 - All dependencies match
#   1 - Version mismatches detected
#

versions_file=$(mktemp)
conflicts_file=$(mktemp)

extract_versions() {
  package_json="$1"
  project_name="$2"

  # Extract dependencies using jq, handling null values
  jq -r '
    (.dependencies // {}) + (.devDependencies // {}) | to_entries | .[] | "\(.key) \(.value)"
  ' "$package_json" | \
  while read -r pkg version; do
    # Check if package already exists
    found_version=$(grep "^$pkg " "$versions_file" | cut -d' ' -f2)

    if [ -n "$found_version" ] && [ "$found_version" != "$version" ]; then
      echo "$pkg $project_name (v$version)" >> "$conflicts_file"
    else
      # Store or overwrite package version
      grep -v "^$pkg " "$versions_file" > "${versions_file}.tmp"
      echo "$pkg $version" >> "${versions_file}.tmp"
      mv "${versions_file}.tmp" "$versions_file"
    fi
  done
}

# Scan all directories up to two levels deep
find . -mindepth 1 -maxdepth 2 -type f -name "package.json" | while read -r package_json; do
  project_dir=$(dirname "$package_json")
  extract_versions "$package_json" "$project_dir"
done

# Check for conflicts
if [ -s "$conflicts_file" ]; then
  echo "❌ Dependency version mismatch detected!"
  sort "$conflicts_file" | uniq | while read -r conflict; do
    pkg=$(echo "$conflict" | cut -d' ' -f1)
    versions=$(grep "^$pkg " "$versions_file" | cut -d' ' -f2 | uniq)
    echo "$conflict (expected v$versions)"
  done
  echo "Fix the version mismatches before committing."
  rm -f "$versions_file" "$conflicts_file"
  exit 1
fi

echo "✅ All dependencies match across workspaces."
rm -f "$versions_file" "$conflicts_file"
exit 0
