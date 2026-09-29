## Why

`main` carries 30 open Dependabot alerts (10 high, 16 medium, 4 low across 13 packages) and 6 CodeQL alerts, and 33 of 34 Dependabot security-update runs failed with `security_update_not_possible` because the repository has no `.github/dependabot.yml` and the transitive dependency graph cannot be fixed by a point upgrade. The branch `fix/update-actions` already moved the toolchain to Node 24 / pnpm 12.6.0, so this is the moment to land a single remediation that clears the alert backlog and stops it from regrowing.

## What Changes

- Regenerate `pnpm-lock.yaml` on pnpm 12.6.0 so no installed version matches any of the 30 alert ranges (this removes `braces` entirely and lifts `undici`, `uuid`, the `@octokit/*` packages, `js-yaml`, `browserslist`, `brace-expansion`, `@babel/core`, `picomatch` and `minimatch` out of vulnerable ranges).
- Record and enforce the direct-dependency selection policy: latest stable release published at least five days ago, with two documented compatibility exceptions — TypeScript `6.0.3` (TypeScript 7 is outside the `ts-jest` `<7` peer range) and `@types/node` pinned to the Node 24 action runtime line.
- Apply the five-day minimum release age as a **one-time install flag** (`--config.minimumReleaseAge=7200`), never as persisted repository configuration, so urgent security patches are never blocked.
- Declare `engines.pnpm` in `package.json` so Dependabot selects the same package manager as CI.
- Rebuild the checked-in `task.js` bundles and keep the existing PR-workflow integrity check green.
- Harden workflows: give `.github/workflows/tester.yml` jobs `contents: read` (closing CodeQL `actions/missing-workflow-permissions` alerts #1–3), drop its empty `env: {}` map, fix the unterminated quotes in `release.yml`, and clear the shellcheck style warnings in `pr.yml` so `actionlint` passes repo-wide.
- Add `.github/dependabot.yml`: weekly npm and GitHub Actions updates, npm runtime and development **version** updates grouped separately from **security** updates, grouped Actions updates, and a five-day cooldown that applies to version updates only (GitHub does not apply cooldown to security updates, and immediate security updates are the deliberate choice).
- Document the triage decision for CodeQL `js/weak-cryptographic-algorithm` alerts #4–6: bundled Undici computes the RFC 6455 WebSocket handshake SHA-1 over the fixed public GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, not secret data. Dismiss as false positives **only after** inspecting each trace in the GitHub UI; do not substitute SHA-256.
- Verify post-merge that alerts close on `main` and retry any still-failing security-update jobs.

## Capabilities

### New Capabilities
- `dependency-supply-chain`: how direct dependency versions are selected, how the lockfile is regenerated and audited, and how the checked-in action bundles stay reproducible.
- `workflow-hardening`: least-privilege `permissions` on every workflow job plus a clean `actionlint` baseline.
- `dependabot-automation`: the scheduled, grouped, cooldown-aware Dependabot configuration and its package-manager alignment with CI.
- `security-alert-triage`: evidence rules for dismissing scanner findings and for confirming alerts actually close after merge.

### Modified Capabilities
<!-- None: openspec/specs/ is currently empty. -->

## Impact

- Files: `package.json`, `pnpm-lock.yaml`, `.github/dependabot.yml` (new), `.github/workflows/{tester,pr,release}.yml`, the generated `*/task.js` bundles, and a `SECURITY-REMEDIATION.md` record.
- Dependencies: runtime `@actions/github` tree plus the build/test toolchain; no application source or public action inputs/outputs change.
- Consumers: none — action interfaces (`action.yml`) are untouched, so this is non-breaking for downstream workflows.
- External systems: GitHub Dependabot, code scanning (CodeQL), and the existing PR build-integrity check.
