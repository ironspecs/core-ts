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
- `src/types`: package-level type augmentation.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- Import from `@core-ts/react` only.
- Anything intended for consumers must be exported from `src/index.ts`.
- Deep imports into `src`, `dist`, components, hooks, types, or `lib` are
  private implementation details.
- Components must not own app-specific data fetching, navigation, persistence,
  or product policy.
