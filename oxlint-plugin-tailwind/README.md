# @core-ts/oxlint-plugin-tailwind

Private Core TS Oxlint plugin for Tailwind class policy.

This package owns reusable Tailwind class parsing and enforcement mechanics.
Consuming repositories own their local policy configuration and ratchet counts.

## Rules

- `tailwind/classes` applies code-owned class groups as either hard bans or
  count-based ratchets.

Current class groups include:

- `backgroundColor`
- `borderColor`
- `borderRadius`
- `daisyColor`
- `fixedBorderRadius`
- `fixedBorderWidth`
- `important`
- `textColor`
- `textSize`

## Boundaries

This package must not contain app-specific class count limits, product-specific
design decisions, or consuming-repo exceptions.
