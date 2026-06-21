# @core-ts/react-i18n

Shared React i18n package for reusable language state, label helpers, i18next
startup, and language UI.

## Purpose

- Own reusable label, language, and app-i18n runtime used by multiple React apps.
- Own shared React adapters for reading and changing the current language.
- Keep strict language and namespace behavior centralized.

## Ownership Boundaries

- This package owns generic language normalization, current-language state,
  i18next setup helpers, and shared language UI.
- Consuming apps own translation files, app names, route language policy,
  namespace selection, and product labels.
- Generated Paraglide/Inlang output is not part of this package.

## Architecture

- `src/lib`: language normalization, current-language store, strict i18next
  setup, startup helpers, app binding, and label factory.
- `src/hooks`: React subscriptions over the package language store.
- `src/components`: shared UI that directly depends on the package language
  runtime.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- Import from `@core-ts/react-i18n` only.
- Deep imports into `src`, `dist`, components, hooks, or `lib` are private
  implementation details.
- `safe*` helpers are the only language helpers that return absence for invalid
  input.
- Strict helpers fail fast for unsupported languages, missing namespaces, and
  invalid translation module paths.
- Importing the package root must not read browser language state; apps perform
  environment-derived startup explicitly.
