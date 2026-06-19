# core-ts

Sibling monorepo for new extracted core TypeScript modules that can be shared by projects outside `react-ts`.

Current workspace modules:

- `react`

Layout:

- `react/src/components`
- `react/src/hooks`
- `react/src/types`
- `react/src/lib`

Common commands:

- `bun install`
- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run lint`

The `react` workspace builds standard distributable runtime and type artifacts into `react/dist`, and can be linked locally into `react-ts` with `npm link`.
Its official source lives in the GitHub `ironspecs/core-ts` repository.
