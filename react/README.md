# @core-ts/react

Shared React-focused core TypeScript package for code extracted from `react-ts`.

Current contents:

- Shared runtime helpers such as `cn`
- Shared React UI primitives such as `Typography`
- Shared behavior bundles such as destructive buttons, feature-gated buttons,
  submit buttons, markdown, theme toggles, and feature flags
- React type augmentation for `data-testid`
- Source files under `src/`
- Standard `tsc` build output under `dist/`
- The package root is the only public entrypoint

Common commands:

- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`

## Public Surface

Import from `@core-ts/react` only. Deep imports into `dist`, `src`,
components, hooks, types, or `lib` are private implementation details and are
not supported API.
