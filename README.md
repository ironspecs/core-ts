# core-ts

Sibling monorepo for new extracted core TypeScript modules that can be shared by projects outside `react-ts`.

Current workspace modules:

- `react`
- `react-i18n`
- `react-progression`
- `react-form-builder`
- `oxlint-plugin-tailwind`
- `oxlint-plugin-types`

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
- `oxlint-plugin-tailwind/rules`
- `oxlint-plugin-types/rules`

Common commands:

- `bun install`
- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
- `bun run check:dependencies`
- `scripts/assert-dts-match.sh <release-artifact-root> <current-repo-root>`
- `scripts/github-login.sh`

Git hooks:

- Run `git config core.hooksPath .githooks` after cloning to enable the
  tracked commit and push hooks.
- Commit and push hooks both run `./scripts/check-dependency-versions.sh`.

GitHub CLI auth:

- Use `scripts/github-login.sh` when `gh` is not authenticated for the
  `ironspecs` organization account.
- The script decrypts `.env.enc` with SOPS, reads `GITHUB_TOKEN`, and runs
  `gh auth login --with-token`.
- Run `gh auth status` before opening or inspecting pull requests if command
  behavior is surprising.

Public package API:

- Each workspace package exposes only its package root.
- Deep imports into package internals, `dist`, `src`, component directories,
  hooks, types, fields, or `lib` are unsupported implementation details.
- Anything intended for consumers must be re-exported from that package's
  `src/index.ts`.

Release branch workflow:

- Direct pushes to `release` are blocked by repository rules.
- Release branch updates must be made through reviewed pull requests targeting
  `release`.
- Pushes to `release` run the `Release Artifact` workflow after the GitHub
  `release` environment is approved.
- That workflow builds the workspace packages and uploads a timestamped
  `dist-YYYY-MM-DD-HH-MM` artifact containing each package `dist` directory.
- The `dts-release-gate` CI job for `main` downloads the latest successful
  `release` artifact and compares its generated `*.d.ts` files against the
  current build.
- Public declaration changes must be accepted through the `release` branch
  before they can pass the `main` branch gate.
- For public API or declaration changes, branch from `release`, open the pull
  request against `release`, merge it after approval, and wait for the release
  artifact workflow to complete successfully.
- After the release artifact exists, open or update the corresponding `main`
  pull request. The `main` DTS gate should then compare against the accepted
  release artifact instead of failing on unreleased declaration drift.

The `react` workspace builds standard distributable runtime and type artifacts into `react/dist`, and can be linked locally into `react-ts` with Bun `file:` overrides.
Its official source lives in the GitHub `ironspecs/core-ts` repository.
