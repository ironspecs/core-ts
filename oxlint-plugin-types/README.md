# @core-ts/oxlint-plugin-types

Private Core TS Oxlint plugin for TypeScript declaration-count policies.

This package owns reusable type-count enforcement mechanics. Consuming
repositories own their local ratchet counts.

## Rules

- `types/max-type-declarations` limits TypeScript type aliases and interfaces
  across a lint target.
- `types/max-type-aliases` is kept as the same rule for compatibility.

## Boundaries

This package must not contain app-specific type limits or project-local
exceptions.
