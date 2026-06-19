# Theme Toggle

This package owns light/dark theme behavior for shared layouts.

## Why this exists

- Keep theme UI and persistence logic together so behavior is easier to reason about.
- Keep the visible toggle unchanged while making persistence stable across subdomains.
- Keep caller-provided UI strings at the component boundary through a required `labels` object.

## Public surface

- `ThemeToggleIconButton`
- `ThemeToggleIconButtonLabels`
- `ThemeToggleIconButtonProps`
- `Theme`
- `ThemePreferenceOptions`
- `ThemePreferenceContext`
- theme preference helper functions from `theme-preference.ts`

## Files

- `ThemeToggleIconButton.tsx`: visual toggle button.
- `theme-preference.ts`: persistence and initialization utilities.
- `ThemeToggleIconButton.test.tsx`: component behavior tests.
- `theme-preference.test.ts`: unit tests for domain/cookie/storage behavior.

## Caller responsibilities

- Callers must pass `labels.switchToDarkMode` and `labels.switchToLightMode`.
- Callers may pass `sharedCookieDomain` when theme preference should persist across subdomains.

## Behavior guarantees

- No visual change to the control itself.
- SSR-safe guards around browser globals.
- Cookie key is fixed to `theme`.
- Cross-subdomain preference sharing is deterministic when `sharedCookieDomain` is configured consistently.
