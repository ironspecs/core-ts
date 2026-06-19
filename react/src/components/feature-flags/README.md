# Feature Flags

This package owns shared feature-flag resolution, storage, and React context behavior.

## Why this exists

- Keep feature-flag cookie/query behavior next to the provider that consumes it.
- Keep merge precedence explicit across resolved flags, context flags, and user flags.
- Keep nested provider behavior predictable.

## Public surface

- `FeatureFlagProvider`
- `FeatureFlagProviderProps`
- `useFeatureFlags`
- `FeatureFlags`
- `resolveFeatureFlags`

## Files

- `FeatureFlagProvider.tsx`: provider and hook.
- `feature-flags.ts`: query/cookie/reload helpers.
- `FeatureFlagProvider.test.tsx`: provider behavior tests.
- `feature-flags.test.ts`: helper behavior tests.

## Behavior guarantees

- Root providers merge resolved session flags with caller context flags.
- Nested providers inherit parent user flags and add nested context flags.
- User flags override merged static flags.
- `useFeatureFlags` throws outside a provider.
