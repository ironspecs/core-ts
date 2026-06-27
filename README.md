# core-ts

Shared TypeScript package workspace for reusable code extracted from application
repositories.

## Purpose

- Own reusable TypeScript modules that can serve more than one consuming app.
- Keep shared React, form, i18n, progression, and tooling primitives in stable
  packages.
- Keep package API boundaries explicit so extracted code does not drift back
  toward app-local ownership.

## Ownership Boundaries

- This repo owns generic contracts, reusable runtime helpers, lint rules, and
  package root exports for the workspace packages.
- Consuming apps own product policy, route behavior, persistence, labels,
  translation catalogs, workflow names, and API calls.
- Business decisions should move upward into apps unless a workspace package
  truly owns the generic rule.
- Low-level utility should move downward into the smallest package that can own
  and test it honestly.

## Architecture

- `react`: shared React primitives, hooks, helpers, and behavior bundles.
- `react-i18n`: shared language, label, and i18next runtime bindings.
- `react-progression`: generic workflow/progression planning and runtime UI.
- `react-form-builder`: schema-driven form contracts, registry, and rendering.
- `oxlint-plugin-tailwind`: reusable Oxlint rules for Tailwind class policy.
- `oxlint-plugin-types`: reusable Oxlint rules for TypeScript type policy.
- Each workspace package exposes its package root as its supported public API.

## Invariants

- Deep imports into `src`, `dist`, component folders, hooks, types, fields,
  rules, or `lib` are unsupported implementation details.
- Public API changes are represented by generated declaration output and must
  pass the repository declaration gate.
- Shared packages must stay reusable across consuming repositories.
- Package READMEs own multi-file package rules. TypeScript file comments own
  single-file responsibilities and invariants.

## Commands

- `bun install`
- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
- `bun run check:dependencies`
- `scripts/assert-dts-match.sh <release-artifact-root> <current-repo-root>`
- `scripts/github-login.sh`

## GitHub CLI Auth

- Use `scripts/github-login.sh` when `gh` is not authenticated for the
  `ironspecs` organization account.
- The script decrypts `.env.enc` with SOPS, reads `GITHUB_TOKEN`, and runs
  `gh auth login --with-token`.
- Run `gh auth status` before opening or inspecting pull requests if command
  behavior is surprising.

## Git Hooks

- Run `git config core.hooksPath .githooks` after cloning to enable the tracked
  commit and push hooks.
- Commit and push hooks both run `./scripts/check-dependency-versions.sh`.

## Release Flow

- The `release` branch is only for changes that affect public package API or
  generated declaration output.
- Release branch updates must be made through reviewed pull requests targeting
  `release`.
- After approval, merge release pull requests locally from the `release` branch
  with `git merge --ff-only <approved-branch>`, then push `release`. GitHub's
  merge buttons cannot satisfy the signed-commit release rules.
- Pushes to `release` run the `Release Artifact` workflow after the GitHub
  `release` environment is approved.
- That workflow builds the workspace packages and uploads a timestamped
  `dist-YYYY-MM-DD-HH-MM` artifact containing each package `dist` directory.
- The `dts-release-gate` CI job for `main` downloads the latest successful
  `release` artifact, asserts the checked `main` result includes the `release`
  tip commit SHA, and compares its generated `*.d.ts` files against the current
  build.
- Public declaration changes must be accepted through the `release` branch
  before they can pass the `main` branch gate.
- After the release artifact exists, update the corresponding `main` pull
  request. The `main` DTS gate should then compare against the accepted release
  artifact instead of failing on unreleased declaration drift.
