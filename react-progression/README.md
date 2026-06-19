# @core-ts/react-progression

Generic React workflow and progression runtime extracted from the live `react-ts`
workflow path.

## Purpose

- Own fixed workflow-plan compilation, cursor movement, progress derivation, and
  explicit runtime-context updates.
- Own the shared `Progression` step render shell and step component contract.
- Keep business workflow names, step registries, facts, labels, API calls, and
  route behavior in consuming apps.

## Architecture

- `src/components`: React progression render components.
- `src/hooks`: React workflow runtime adapters.
- `src/lib`: pure workflow planning, runtime, facts-key, runtime-slice, and log
  helpers.
- `src/types`: public step and workflow contracts.

## Invariants

- A workflow plan is compiled once for a facts key and is immutable for that run.
- Runtime context is the durable continuity channel across workflow movement.
- Steps receive readonly facts and context snapshots.
- Steps update runtime context only through explicit patches or operation
  results.
- Runtime slices store plain `Record<string, unknown>` data. They do not
  pretend a string slice id proves a narrower caller-selected generic type.
- Skip operations execute automatically and are never back-navigation targets.
- The package uses generic `Progression` and `Workflow` vocabulary only.

## Public Surface

Import from `@core-ts/react-progression` unless a subpath export is needed for a
narrow migration.

Common commands:

- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
