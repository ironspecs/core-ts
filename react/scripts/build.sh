#!/bin/sh
# Build declaration outputs for the @core-ts/react package.
# Keep this script POSIX-sh so it can run in minimal environments.
# The package currently ships type augmentations, so we emit declarations
# with tsc and then copy the augmentation source into dist/types so the
# emitted package entrypoint resolves through the public package root.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$PROJECT_DIR"
rm -rf dist
bunx tsc -p tsconfig.build.json
mkdir -p dist/types
cp src/types/react-augmented.d.ts dist/types/react-augmented.d.ts
