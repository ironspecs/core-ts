---
name: release
description: Use for core-ts release/main branch gates and release artifact verification.
---

# Release

## Critical

- Run `./scripts/github-login.sh` before any GitHub operation.
- `release` requires PR approval, signed commits, and linear history.
- Squash merges and merge commits are banned.
- `gh pr merge` cannot satisfy the `release` rules. Do not use it.
- Merge approved release PRs only with local `git merge --ff-only`, then push `release`.
- Do not bypass hooks. Local `git push` runs the repo pre-push dependency check.

## Useful Commands

Check branch heads:

```bash
git ls-remote --heads origin main release
```

Check PR state:

```bash
gh pr view <number> --repo ironspecs/core-ts \
  --json state,reviewDecision,mergeStateStatus,statusCheckRollup
```

Watch PR checks:

```bash
gh pr checks <number> --repo ironspecs/core-ts --watch --interval 10
```

List release workflow runs:

```bash
gh run list --workflow release-artifact.yml --branch release --limit 5
```

List artifacts for a run:

```bash
gh api repos/ironspecs/core-ts/actions/runs/<run-id>/artifacts \
  --jq '.artifacts[] | {name, expired, size_in_bytes}'
```

Fast-forward `release` to an approved PR head:

```bash
git fetch origin release <pr-branch>
git switch -C release origin/release
git merge --ff-only <pr-branch>
git push origin release
```

## Instructions

1. Authenticate and verify state.
   - Run `./scripts/github-login.sh`.
   - Check `git status --short --branch`.
   - Check `git ls-remote --heads origin main release`.

2. For repo-side release script changes, commit and push to `main` first.
   - Stage only intended files.
   - Commit normally and let hooks run.
   - Push to `main`.
   - If the first `main` DTS gate runs before any release artifact exists, create the first `release` artifact and rerun or recheck CI.

3. Verify `release` protection.
   - Create a small signed verification commit on a branch.
   - Try `git push origin HEAD:release`.
   - Confirm GitHub rejects the push with `GH013` when direct pushes are blocked.
   - Push the branch and create a PR to `release`.
   - Wait for `test` and `dts-release-gate` to pass.
   - Confirm review is required before merge.

4. Merge the approved release PR without squashing.
   - After approval, fetch `origin/release` and the PR branch.
   - Run `git switch -C release origin/release`.
   - Run `git merge --ff-only <pr-branch>`.
   - Run `git push origin release`.
   - Confirm GitHub marks the PR merged.

5. Confirm release artifact creation.
   - Find the newest `release-artifact.yml` run on `release`.
   - Wait for it to complete successfully.
   - List the run artifacts.
   - Confirm a non-expired `dist-YYYY-MM-DD-HH-MM` artifact exists.

6. Verify `main` protection.
   - Tell the user to require PRs and required checks `test` and `dts-release-gate` on `main`.
   - Try a direct push to `main` and confirm it is blocked.
   - Open a mismatch PR that changes generated declarations and confirm `dts-release-gate` fails.
   - Open or update a match PR with declarations equal to the latest release artifact and confirm `dts-release-gate` passes.
