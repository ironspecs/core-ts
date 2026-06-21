# @core-ts/react-progression

Generic React workflow and progression package for fixed plans, cursor movement,
runtime context updates, and progression UI.

## Purpose

- Own reusable workflow-plan compilation, cursor movement, and progress
  derivation.
- Own explicit runtime-context update mechanics for progression flows.
- Own the shared `Progression` render shell and step component contract.

## Ownership Boundaries

- This package owns generic progression and workflow runtime vocabulary.
- Consuming apps own workflow names, step registries, facts, labels, API calls,
  persistence, and route behavior.
- Runtime helpers must not encode product-specific workflow policy.

## Architecture

- `src/components`: React progression render components.
- `src/hooks`: React adapters for progression workflows and workflow draft
  state.
- `src/lib`: pure workflow planning, runtime, facts-key, workflow context value,
  and log helpers.
- `src/types`: public step and workflow contracts.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- Import from `@core-ts/react-progression` only.
- Deep imports into `src`, `dist`, components, hooks, types, or `lib` are
  private implementation details.
- A workflow plan is compiled once for a facts key and is immutable for that run.
- Runtime context is the durable continuity channel across workflow movement.
- Steps receive readonly facts and context snapshots.
- Steps update runtime context only through explicit patches or operation
  results.
- Skip operations execute automatically and are never back-navigation targets.
