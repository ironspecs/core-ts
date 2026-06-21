# @core-ts/react-form-builder

Shared React form-builder package for schema-driven form contracts, registry
contracts, field rendering, and reusable form value helpers.

## Purpose

- Own generic schema contracts, registry contracts, and shared form rendering
  helpers.
- Own reusable form value path utilities exposed through the package root.
- Keep schema-driven form behavior reusable across consuming apps.

## Ownership Boundaries

- This package owns generic form schema and registry vocabulary.
- Consuming apps own product-specific fields, labels, API calls, persistence,
  validation policy, and route behavior.
- Field dispatch is owned by registry and schema contracts, not app-local type
  assertions.

## Architecture

- `src/formBuilder.tsx`: root form builder and field rendering behavior.
- `src/registry.tsx` and `src/registryTypes.ts`: default registry and registry
  contracts.
- `src/schema.ts`, `src/sharedSchema.ts`, and `src/viewerSchema.ts`: public
  schema types.
- `src/fields`: implementation field components used by the default registry.
- `src/dotPath.ts`: shared path helpers for form values.
- `src/index.ts`: the only supported public export boundary.

## Invariants

- Import from `@core-ts/react-form-builder` only.
- Deep imports into `src`, `dist`, fields, or helper files are private
  implementation details.
- Anything intended for consumers must be exported from `src/index.ts`.
- Default fields must remain generic and must not embed consuming-app product
  policy.
