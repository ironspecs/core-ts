# @core-ts/react

Shared React package for reusable UI primitives, hooks, behavior components, and
small runtime helpers.

## Purpose

- Own React-focused code that is generic enough to reuse across consuming apps.
- Own package-level React type augmentation needed by the shared components.
- Keep shared UI and helper vocabulary available through one package root.

## Ownership Boundaries

- This package owns generic React primitives, behavior bundles, hooks, and
  mechanical helpers.
- Consuming apps own product labels, route decisions, persistence, data fetching,
  feature policy, and app-specific composition.
- Helpers in `src/lib` must stay mechanical and testable.

## Architecture

- `src/components`: reusable React components and behavior bundles.
- `src/hooks`: shared React hooks with no app ownership assumptions.
- `src/lib`: package-owned mechanical utilities.
- `src/styles`: package-owned shared styling contracts for reusable UI sizing and
  other cross-component class surfaces.
- `src/types`: package-level type augmentation.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- Import from `@core-ts/react` only.
- Anything intended for consumers must be exported from `src/index.ts`.
- Public stylesheet contracts must be loaded from `@core-ts/react/app.css`
  exactly once per app, preferably from the app entrypoint before shared
  components render.
- Deep imports into `src`, `dist`, components, hooks, types, or `lib` are
  private implementation details.
- Components must not own app-specific data fetching, navigation, persistence,
  or product policy.

## Public Styling Contract

- `@core-ts/react/app.css` owns shared CSS classes that depend on the consuming
  app's Tailwind and DaisyUI variable contract.
- Consuming apps should import `@core-ts/react/app.css` from their runtime
  entrypoint module instead of piping it through the app's Tailwind source CSS.
- `--core-button-size` is the package-owned button size token. It resolves to
  `calc(var(--size-field, 0.25rem) * 10)` so shared classes track the default
  DaisyUI button size without depending on DaisyUI's internal `.btn` local
  variable.
- `.c-btn-min-w` sets `min-width` to `var(--core-button-size)`.
- `.c-btn-min-h` sets `min-height` to `var(--core-button-size)`.
- Applying both classes gives an element a minimum square footprint equal to the
  shared default button size.
