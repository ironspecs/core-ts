# Submit Button

This package owns the shared submit transaction interaction.

## Why This Exists

- Keep one-shot async submit state consistent across apps.
- Keep busy and success rendering tied to the transaction state.
- Prevent accidental duplicate submit work.
- Keep product-specific labels in the consuming app.

## Public Surface

- `SubmitButton`
- `SubmitButtonProps`
- `SubmitButtonState`
- `SubmitActionRunResult`
- `useSubmitAction`
- `UseSubmitActionParams`
- `UseSubmitActionResult`

## Files

- `SubmitButton.tsx`: visual submit button for idle, busy, and success states.
- `useSubmitAction.ts`: transaction-state hook for async submit actions.
- `*.test.tsx`: component and hook behavior tests.

## Caller Responsibilities

- Provide the visible submit label as children.
- Keep app-specific wording and validation outside this package.
- Await all submit work inside the action passed to `useSubmitAction`.

## Behavior Guarantees

- `busy` disables the button and sets `aria-busy`.
- `success` is terminal and disables the button.
- Failed actions return the state to `idle` and expose the error.
- Repeated `runIfIdle` calls return `skipped` while busy or after success.
