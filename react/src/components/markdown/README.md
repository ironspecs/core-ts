# Markdown

This package owns shared markdown rendering behavior for product copy and formatted help content.

## Why this exists

- Keep sanitization, routing, and markdown presentation rules together.
- Keep long-form formatted copy rendering consistent across apps.
- Keep internal vs external link handling predictable.

## Public surface

- `MarkdownBlock`
- `MarkdownBlockProps`

## Files

- `MarkdownBlock.tsx`: sanitized markdown renderer.
- `MarkdownBlock.test.tsx`: rendering behavior tests.

## Behavior guarantees

- Empty markdown renders nothing.
- Internal links render with TanStack Router links.
- External links open safely with `target=\"_blank\"` and `rel=\"noreferrer\"`.
- Markdown is sanitized before rendering.
