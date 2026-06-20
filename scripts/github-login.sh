#!/bin/bash
set -euo pipefail

# Disable gh interactive prompts
export GH_PROMPT_DISABLED=1

# Log into GitHub CLI using the token from .env.enc
#
# USAGE:
#   ./scripts/github-login.sh
#
# PREREQUISITES:
#   - SOPS installed and configured with age key
#   - .env.enc exists at repo root with GITHUB_TOKEN
#
# This script:
#   1. Decrypts .env.enc using SOPS
#   2. Extracts the GITHUB_TOKEN
#   3. Authenticates gh CLI with the token

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_ENC="$REPO_ROOT/.env.enc"

if [[ ! -f "$ENV_ENC" ]]; then
  echo "Error: $ENV_ENC not found"
  echo "Create it with: sops -e --input-type dotenv --output-type dotenv .env > .env.enc"
  exit 1
fi

# Decrypt and extract the GitHub token
GITHUB_TOKEN=$(sops -d --input-type dotenv --output-type dotenv "$ENV_ENC" | grep '^GITHUB_TOKEN=' | cut -d'=' -f2-)

if [[ -z "$GITHUB_TOKEN" ]]; then
  echo "Error: GITHUB_TOKEN not found in $ENV_ENC"
  exit 1
fi

# Authenticate with GitHub CLI
echo "$GITHUB_TOKEN" | gh auth login --with-token

echo "Authenticated with GitHub as: $(gh api user --jq .login)"
