# core-ts

Shared TypeScript package workspace for reusable code extracted from application
repositories.

## Purpose

- Own reusable TypeScript modules that can serve more than one consuming app.
- Keep shared React, form, i18n, and progression primitives in stable packages.
- Keep package API boundaries explicit so extracted code does not drift back
  toward app-local ownership.

## Ownership Boundaries

- This repo owns generic contracts, reusable runtime helpers, and package root
  exports for the workspace packages.
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
- Each workspace package exposes its package root as its supported public API.

## Invariants

- Deep imports into `src`, `dist`, component folders, hooks, types, fields, or
  `lib` are unsupported implementation details.
- Public API changes are represented by generated declaration output and must
  pass the repository declaration gate.
- Shared packages must stay reusable across consuming repositories.
- Package READMEs own multi-file package rules. TypeScript file comments own
  single-file responsibilities and invariants.
