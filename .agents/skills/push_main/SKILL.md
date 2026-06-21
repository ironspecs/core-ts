---
name: push_main
description: Use to push a checked branch into core-ts main.
---

# Push Main

## Critical

- Direct pushes to `main` are blocked, create a PR, wait for checks, and then git merge --ff-only.
- `main` requires `test` and `dts-release-gate` checks to pass before merging.
- If generated `*.d.ts` changes from latest release then human approval is required via `release` skill, but avoid API changes if possible.
- Bypassing hooks or force pushing to `main` or `release` is blocked, do not attempt to bypass these protections.

## Commands

```bash
git status --short --branch
bun run build
bun run test
bun run typecheck
git diff -- '*/dist/*.d.ts'
git push -u origin HEAD
gh pr create --repo ironspecs/core-ts --base main --head "$(git branch --show-current)"
gh pr checks <number> --repo ironspecs/core-ts --watch --interval 10
```

## Instructions

1. Create or switch to a topic branch.
2. Run build, test, and typecheck.
3. Check generated declaration diffs.
4. If `*.d.ts` changed, stop and use `release`.
5. Commit intended files only.
6. Push the branch.
7. Open a PR to `main`.
8. Verify `test` and `dts-release-gate` pass.
