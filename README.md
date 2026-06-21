# core-ts

Sibling monorepo for new extracted core TypeScript modules that can be shared by projects outside `react-ts`.

Current workspace modules:

- `react`
- `react-i18n`
- `react-progression`
- `react-form-builder`

Layout:

- `react/src/components`
- `react/src/hooks`
- `react/src/types`
- `react/src/lib`
- `react-i18n/src/components`
- `react-i18n/src/hooks`
- `react-i18n/src/lib`
- `react-progression/src/components`
- `react-progression/src/hooks`
- `react-progression/src/types`
- `react-progression/src/lib`

Common commands:

- `bun install`
- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
- `bun run check:dependencies`
- `scripts/assert-dts-match.sh <release-artifact-root> <current-repo-root>`

Git hooks:

- Run `git config core.hooksPath .githooks` after cloning to enable the
  tracked commit and push hooks.
- Commit and push hooks both run `./scripts/check-dependency-versions.sh`.

Public package API:

- Each workspace package exposes only its package root.
- Deep imports into package internals, `dist`, `src`, component directories,
  hooks, types, fields, or `lib` are unsupported implementation details.
- Anything intended for consumers must be re-exported from that package's
  `src/index.ts`.

Release branch workflow:

- Pushes to `release` run the `Release Artifact` workflow after the GitHub
  `release` environment is approved.
- That workflow builds the workspace packages and uploads a timestamped
  `dist-YYYY-MM-DD-HH-MM` artifact containing each package `dist` directory.
- The `quality` CI job runs build, lint, typecheck, tests, and package export
  checks in one runner.
- The `dts-release-gate` CI job for `main` downloads the latest successful
  `release` artifact and compares its generated `*.d.ts` files against the
  current build.
- Public declaration changes must be accepted through the `release` branch
  before they can pass the `main` branch gate.

The `react` workspace builds standard distributable runtime and type artifacts into `react/dist`, and can be linked locally into `react-ts` with Bun `file:` overrides.
Its official source lives in the GitHub `ironspecs/core-ts` repository.
