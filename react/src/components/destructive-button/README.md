# Destructive Button

This package owns the shared destructive-action confirmation interaction.

## Why This Exists

- Keep irreversible-action confirmation behavior together with its trigger.
- Keep exact-match confirmation, pending disabling, and error display
  consistent across apps.
- Keep product-specific labels and destructive operations at the caller
  boundary.

## Public Surface

- `DestructiveButton`
- `DestructiveButtonProps`
- `DestructiveButtonLabels`
- `DeleteConfirmationDialog`
- `DeleteConfirmationDialogProps`
- `DeleteConfirmationDialogLabels`

## Files

- `DestructiveButton.tsx`: destructive trigger and confirmation-dialog state.
- `DeleteConfirmationDialog.tsx`: exact-match confirmation dialog.
- `*.test.tsx`: component behavior tests.

## Caller Responsibilities

- Provide all labels.
- Provide the exact `matchValue`.
- Own pending/error state for the destructive operation.
- Perform the destructive operation in `onConfirm`.

## Behavior Guarantees

- The trigger is disabled while pending or explicitly disabled.
- Opening resets the confirmation input.
- Cancelling resets the confirmation input and closes the dialog.
- Confirmation is enabled only when input exactly matches `matchValue`.
