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

- Public API is represented by version tags matching `v*`. A tag is the single
  accepted-declaration surface; there is no long-lived `release` branch.
- Cutting a release means pushing a `v*` tag (e.g. `git tag v0.1.0 && git push
  origin v0.1.0`).
- The `Tag Release` workflow (`tag-release.yml`) triggers on that tag push: it
  builds the workspace packages, creates a GitHub Release named after the tag,
  and attaches the `bun pm pack` tarballs for `react`, `react-i18n`,
  `react-progression`, and `react-form-builder` as release assets.
- The `DTS Gate` workflow (`dts-gate.yml`) runs only for pull requests targeting
  `main`. It resolves the nearest ancestor tag (`git describe --tags
  --abbrev=0`), downloads that tag's release assets, and compares the released
  `*.d.ts` files against the pull request's build.
- The comparison uses the shared
  `softwarepatterns/github-actions/assert-dts-match@v1` action.
- If the nearest tag has no GitHub release yet, `DTS Gate` fails with a message
  directing you to push the `v*` tag so the release is created first.
- Pull requests targeting `main` are blocked unless their generated declarations
  match the nearest accepted release. Accept a public declaration change by
  cutting a new `v*` tag, then update the `main` pull request so it compares
  against the new release.
