# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## CRITICAL

- Do not follow symlinks when auditing installed packages or dependency
  resolution. Use non-dereferencing checks such as `ls -ld`, `readlink`, or
  `find -P`; never use symlink traversal as evidence for package layout.

## Repository intent

- Keep shared packages reusable across multiple repos.
- Keep low-level utility pushed downward into testable libraries.
- Keep business and product decisions out of this repo unless the package truly
  owns them.
- Prefer low-churn boundaries. This repo is intended to be harder to edit
  casually than app-local workspaces.

## Required docs to keep current

Each TypeScript module directory in `react/` and `react-form-builder/` must have a `README.md` that explains:

- the module purpose and scope
- the module ownership boundaries
- the module architectural approach
- the invariants, rules, and decisions shared across multiple files

Each TypeScript `.ts` or `.tsx` file must begin with a file-level comment that explains:

- the file purpose
- what the file owns
- the local invariants and rules for that file

Multi-file rules belong in the module `README.md`. Single-file rules belong in that file comment.

If a task changes process boundaries, protocols, ownership, package layout, build commands, or operator workflows, update the affected module `README.md` files in the same change, and update TypeScript file comments when local file responsibilities or invariants changed.

## Package Management

The repo uses Bun with this required `bunfig.toml` install shape:

```toml
[install]
globalStore = true
linker = "isolated"
```

## Design rules

All business decisions should be pushed forward and upward into consuming
codebases. Shared utility should be pushed downward into the smallest honest
package that can own it.

All functions must have cyclomatic and cognitive complexity less than 20.

When there is a choice, prefer the least surprising behavior.

All code must fail fast and be strict with assertions.

All functions must do exactly what their names promise, never more or less.

Never return graceful empty fallback values unless the function is explicitly
named `*_safe` or `try_*` and that weaker contract is the real contract.

Respect the Law of Demeter. Prefer context objects over long parameter lists.

Prefer maps of functions over long switch or `if`/`else` chains when that keeps
decision ownership clearer.

## Handoff checklist

Before finishing a task:

1. Explain what changed.
2. List commands that were run.
3. List anything not verified.
4. Point to updated docs.
5. State whether repository invariants still hold.
