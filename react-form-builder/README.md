# @core-ts/react-form-builder

Shared React form-builder package extracted from reusable schema-driven form
runtime and rendering code.

## Purpose

- Own generic schema contracts, registry contracts, and shared form rendering
  helpers.
- Keep product-specific field choices, labels, API calls, persistence, and route
  behavior in consuming apps.
- Keep low-level form utilities reusable through the package root.

## Architecture

- `src/formBuilder.tsx`: root form builder and field rendering behavior.
- `src/registry.tsx` and `src/registryTypes.ts`: field registry defaults and
  registry contracts.
- `src/schema.ts`, `src/sharedSchema.ts`, and `src/viewerSchema.ts`: public
  schema types.
- `src/fields`: implementation field components used by the default registry.
- `src/dotPath.ts`: shared path helpers for form values.

## Invariants

- The package root is the only public entrypoint.
- Deep imports into `dist`, `src`, fields, or helper files are private
  implementation details and are not supported API.
- Generic form schema and registry vocabulary belongs here; product-specific
  decisions belong in consuming apps.
- Field dispatch is owned by the registry and schema contracts, not by
  app-local type assertions.

## Public Surface

Import from `@core-ts/react-form-builder` only.

Common commands:

- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`
