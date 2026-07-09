---
name: release
description: Use for core-ts tag-based releases and DTS gate verification.
---

# Release

## Critical

- Run `./scripts/github-login.sh` before any GitHub operation.
- Public API is represented by `v*` tags. There is no `release` branch and no
  ancestry gate between branches.
- Cutting a release means pushing a `v*` tag. The `Tag Release` workflow
  (`tag-release.yml`) then builds, creates the GitHub Release, and attaches the
  package tarballs.
- Pull requests targeting `main` run the `DTS Gate` workflow
  (`dts-gate.yml`), which compares the pull request's generated `*.d.ts`
  against the nearest ancestor tag's release assets. The comparison uses the
  shared `softwarepatterns/github-actions/assert-dts-match@v1` action.
- If a pull request changes generated declarations, cut a new `v*` tag so the
  release assets carry the accepted declarations, then the `main` pull request
  compares against that release instead of failing on drift.
- Do not bypass hooks. Local `git push` runs the repo pre-push dependency check.

## Useful Commands

List tags and releases:

```bash
git ls-remote --tags origin
gh release list --repo ironspecs/core-ts
```

Inspect a release's assets:

```bash
gh release view <tag> --repo ironspecs/core-ts
```

List Tag Release workflow runs:

```bash
gh run list --workflow tag-release.yml --limit 5
```

Watch pull request checks:

```bash
gh pr checks <number> --repo ironspecs/core-ts --watch --interval 10
```

Resolve the nearest ancestor tag for the current HEAD:

```bash
git describe --tags --abbrev=0
```

## Instructions

1. Authenticate and verify state.
   - Run `./scripts/github-login.sh`.
   - Check `git status --short --branch`.
   - Check `git ls-remote --tags origin` for existing tags.

2. Cut a release.
   - Confirm `main` is at the commit you want to release.
   - Tag it: `git tag <version>` (e.g. `git tag v0.1.0`).
   - Push the tag: `git push origin <version>`.

3. Confirm the Tag Release workflow succeeded.
   - Find the newest `tag-release.yml` run for the tag.
   - Wait for it to complete successfully.
   - Confirm a GitHub Release named after the tag exists with the four
     `core-ts-*.tgz` assets attached.

4. Verify the `main` DTS gate.
   - Tell the user to require PRs and the required checks `quality` and
     `DTS Gate` on `main`.
   - Open a mismatch pull request that changes generated declarations and
     confirm `DTS Gate` fails.
   - Open or update a match pull request whose declarations equal the nearest
     release and confirm `DTS Gate` passes.
