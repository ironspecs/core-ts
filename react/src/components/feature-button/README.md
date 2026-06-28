# Feature Button

This package owns the shared feature-gated action interaction.

## Why This Exists

- Keep entitlement loading, enabled/locked/dormant states, and locked dialog
  behavior together.
- Keep product-specific feature keys, labels, account IDs, and API fetching
  policy at the caller boundary.
- Keep feature value interpretation consistent across apps.

## Public Surface

- `FeatureButton`
- `FeatureButtonProps`
- `FeatureLockedDialog`
- `FeatureLockedDialogProps`
- `isSubscriptionFeatureEnabled`
- feature button and feature-like record types

## Files

- `FeatureButton.tsx`: query-backed feature-gated action button.
- `FeatureLockedDialog.tsx`: locked-state explanation dialog.
- `feature-access.ts`: generic feature-like record interpretation.
- `types.ts`: public type contracts.
- `*.test.tsx` and `*.test.ts`: behavior tests.

## Caller Responsibilities

- Provide all labels.
- Provide feature identity and feature display name.
- Provide account/session context and `fetchFeatures`.
- Keep API base URLs and product-specific loading policy outside this package.
- Perform the enabled action in `onEnabledClick`.

## Behavior Guarantees

- Disabled, missing-session, and forced-locked states resolve as locked.
- Loading access resolves as dormant and disables the trigger.
- Access-loading failures throw instead of being treated as locked access.
- Enabled access runs `onEnabledClick`.
- Locked access opens the locked dialog.
- Locked access owns its visual state with `btn-locked` and does not layer the
  requested enabled variant class underneath it.
