# UI

Shared presentational primitives for reusable app-facing React interfaces.

## Purpose

- Own low-level UI primitives that are generic enough to reuse across multiple
  consuming apps.
- Keep proven component contracts in the colder `@core-ts/react` package so
  they are less exposed to domain-focused churn in app workspaces.

## Ownership Boundaries

- This module owns reusable primitive controls, typography, and shared UI
  interaction contracts.
- Consuming apps own labels, view-model decisions, workflow behavior, and
  product-specific composition around these primitives.

## Architecture

- Each file owns one primitive or a tightly-related pair of primitives.
- Primitives may depend on shared styling contracts from `@core-ts/react/app.css`
  and on generic third-party UI foundations like Radix.
- Stateful primitives should map explicit component state such as `selected`,
  `checked`, `open`, and `disabled` to classes inside the shared wrapper.
- Prefer `cva` to express those state-driven class contracts so visual rules
  stay colocated with the component API rather than leaking through markup.
- Do not rely on DOM attribute selectors like `data-[state=on]` as the primary
  shared styling contract for exported primitives.
- Keep the base class contract of exported primitives as small as possible and
  let DaisyUI or the underlying primitive own default button/input styling
  unless `@core-ts/react` truly owns a stronger reusable override.

## Invariants

- UI primitives must stay generic and must not absorb app-specific business
  policy.
- Shared controls should preserve the least-surprising behavior of their
  underlying primitive unless `@core-ts/react` explicitly owns a stronger
  reusable contract.
- When a primitive has visual state, the shared wrapper must own the mapping
  from component state to classes explicitly so consumers do not depend on
  incidental Radix or DOM attributes.
- Do not freeze copied utility bundles into a primitive when the honest shared
  base is smaller.
- Public primitives in this directory must be exported from `react/src/index.ts`.
