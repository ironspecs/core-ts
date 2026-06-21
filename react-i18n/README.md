# @core-ts/react-i18n

Shared React i18n package extracted from the live `react-ts` i18next path.

## Purpose

- Own the reusable label, language, and app-i18n runtime used by multiple React apps.
- Keep translation files, app names, route language policy, and product labels in consuming apps.
- Keep the extraction limited to currently imported runtime code, not generated leftovers from prior i18n migrations.

## Architecture

- `src/lib`: language normalization, current-language store, strict i18next
  setup, startup helpers, and app binding.
- `src/hooks`: React subscriptions over the package language store and label
  factory hooks.
- `src/components`: shared UI that directly depends on the package language
  runtime.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- `safe*` helpers are the only language helpers that return absence for invalid input.
- Strict helpers fail fast for unsupported languages, missing namespaces, and invalid translation module paths.
- Apps provide translation modules and own namespace policy.
- `LanguageSwitcher` changes the shared current language through `changeLanguage`.
- Importing the package root does not read browser language state; apps initialize environment-derived language through startup helpers.
- Generated Paraglide/Inlang output is not part of this package.

## Public Surface

Import from `@core-ts/react-i18n` only. Deep imports into `dist`, `src`,
components, hooks, or `lib` are private implementation details and are not
supported API.

Common commands:

- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
