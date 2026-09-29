## Context

`Ensono/actions` publishes composite/JavaScript GitHub Actions from a pnpm workspace (`actions-lib-utils`, `eirctl-setup`, `playground-echo`, `process-json`), each shipping a checked-in esbuild bundle (`task.js`) that is verified by a build-integrity step in `.github/workflows/pr.yml`. Because the bundles are committed, vulnerable transitive code is literally part of the published artifact, which is why `undici` alone accounts for 14 of the 30 open Dependabot alerts.

The current branch `fix/update-actions` (PR #7) already carries the Node 24 / pnpm 12.6.0 toolchain update and modern direct dependency pins. What is still missing is the lockfile regeneration evidence, the Dependabot configuration, the workflow hardening, and the written triage record. `openspec/specs/` is empty, so all four capabilities in the proposal are new.

Constraints:
- pnpm 12.6.0 is the build package manager; CI installs it via `npm i -g pnpm@12.6.0`.
- The PR workflow fails if a rebuild dirties the tree, so bundles and lockfile must be committed together.
- CodeQL and Dependabot cannot be run locally; their verification is post-merge.
- Actions consumed by workflows are SHA-pinned in `pr.yml`/`release.yml` but `tester.yml` still uses `actions/checkout@v4`.

## Goals / Non-Goals

**Goals:**
- Land one reviewable change that takes the repository from 30 Dependabot alerts to zero installed vulnerable versions, verified by semver comparison and `pnpm audit`.
- Close the three `actions/missing-workflow-permissions` CodeQL alerts by declaring least-privilege permissions.
- Make the alert backlog self-limiting through scheduled, grouped Dependabot updates aligned with CI's package manager.
- Leave a durable written record (`SECURITY-REMEDIATION.md`) of version-selection exceptions and triage reasoning.

**Non-Goals:**
- Changing any action's public interface (`action.yml` inputs/outputs) or runtime behaviour.
- Replacing the WebSocket handshake SHA-1 inside bundled Undici.
- Dismissing the three `js/weak-cryptographic-algorithm` alerts as part of this change; only the documented justification is produced here.
- Introducing a permanent repository-wide minimum-release-age policy.
- Reworking the release/versioning pipeline beyond the quoting fix.

## Decisions

**1. Build on PR #7 rather than open a parallel remediation branch.**
PR #7 already performs the Node 24 and tooling migration that the upgrades depend on; duplicating it would create conflicting lockfiles. *Alternative considered:* a standalone security-only branch off `main` — rejected because `undici` and `@octokit/*` fixes require the newer toolchain and would immediately conflict with PR #7.

**2. Fix by regenerating the whole lockfile, not by pinning individual vulnerable transitives.**
Most alerts are transitive (`undici`, `braces`, `picomatch`, `minimatch`, `brace-expansion`). A full regeneration plus dedupe on pnpm 12.6.0 lifts them all and removes `braces` from the graph entirely. *Alternative considered:* `pnpm.overrides` entries per CVE — rejected as unmaintainable and a source of silent resolution drift; the `overrides` map stays empty.

**3. Five-day release-age check as a one-time install flag, never persisted.**
`--config.minimumReleaseAge=7200` (minutes) is passed on the install command that regenerates the lockfile. Persisting it in `.npmrc` or `package.json` would delay urgent security patches by five days — exactly the wrong behaviour for this repository. The policy is therefore recorded in specs and `SECURITY-REMEDIATION.md` as a human rule, enforced at dependency-selection time.

**4. Two documented version exceptions.**
TypeScript stays on `6.0.3` because TypeScript 7 falls outside `ts-jest`'s `<7` peer range; `@types/node` tracks the Node 24 action runtime rather than the newest Node 26 typings. `ts-jest` stays on `29.4.13` because `29.4.14` was under five days old at selection time. Each is written down so a future reviewer does not "helpfully" bump them.

**5. Dependabot: group version updates with a cooldown, keep security updates immediate and separate.**
GitHub does not apply cooldown to security updates, so the cooldown is honest only for version updates. The explicit choice is immediate security updates; the alternative — disabling Dependabot security updates to impose a delay — was rejected because it trades a five-day exposure window against losing security automation entirely. Runtime and development npm updates are grouped separately so a runtime bump is never buried in a toolchain PR.

**6. `engines.pnpm` declares the package manager.**
Dependabot picks its npm-manager behaviour from repository metadata; declaring `engines.pnpm: 12.6.0` aligns it with CI's `npm i -g pnpm@12.6.0` and is a plausible contributor to the 33/34 failed update runs. *Alternative considered:* the `packageManager` field with Corepack — rejected because CI does not use Corepack and adding it widens the change.

**7. Workflow permissions declared at workflow level, narrowed per job only where needed.**
`tester.yml` gets `contents: read`; `pr.yml` and `release.yml` already declare blocks and keep their existing scopes. This is the minimum that satisfies `actions/missing-workflow-permissions` without breaking the coverage upload or the release tag push.

**8. `actionlint` is the workflow gate.**
Running it repo-wide (not just on the changed file) surfaced the unterminated quotes in `release.yml`'s `Set Version` step — a latent runtime failure — and shellcheck style warnings in `pr.yml`. Fix rather than suppress.

**9. CodeQL triage is documented now, executed in the GitHub UI later.**
The analysis (SHA-1 over the fixed public RFC 6455 GUID, not secret data) is recorded, but the dismissal itself requires inspecting each alert trace in the UI, which cannot be done from the checkout.

## Risks / Trade-offs

- **Regenerated lockfile changes many transitive versions at once → ** run `pnpm run build`, `pnpm test`, and `pnpm run test:merge` before commit; the PR build-integrity check plus 46 existing tests are the regression net.
- **Rebuilt bundles could differ from what was reviewed → ** commit lockfile and bundles in the same commit and let the CI integrity check prove reproducibility.
- **Immediate security updates can land a <5-day-old release → ** accepted deliberately: exposure to a known CVE is judged worse than exposure to a fresh release; grouped security PRs still pass the full build and test suite before merge.
- **CodeQL/Dependabot cannot be verified locally → ** treat post-merge alert confirmation as a required task, not a formality, and record what remains open.
- **Dismissing the three WebSocket alerts without trace review would hide a real finding → ** the specs forbid dismissal before UI review; this change only supplies the justification text.
- **Config alone may not rescue previously unresolvable security-update runs → ** explicitly plan to retry the failed runs and triage the remaining `security_update_not_possible` cases individually.
- **`tester.yml` pins `actions/checkout@v4` by tag → ** SHA-pin it with this change to match the rest of the repository; low risk, but it is a behaviour change to a workflow that runs on `main` pushes.

## Migration Plan

1. Verify direct dependency versions against the npm registry, then regenerate and dedupe the lockfile with the one-time release-age flag.
2. Rebuild bundles; run build, tests, coverage merge, `pnpm audit`, frozen-lockfile install, and the semver comparison against the 30 alert ranges.
3. Apply workflow permission/lint fixes and run `actionlint` repo-wide.
4. Add `.github/dependabot.yml` and `SECURITY-REMEDIATION.md`.
5. Commit (signed) and push to `fix/update-actions`; let PR #7's checks run.
6. After merge, confirm alert closure on `main`, triage the three CodeQL false positives in the UI, and retry failed security-update runs.

Rollback: the change is additive configuration plus a lockfile bump; reverting the merge commit restores the previous dependency graph, at the cost of reopening the alerts.

## Open Questions

- Should the release-age policy eventually be enforced mechanically (for example a CI check on direct dependency ages) instead of relying on reviewer discipline?
- Should `tester.yml` be narrowed further, or moved off `push: main` to reduce its blast radius?
- Do any of the three `js/weak-cryptographic-algorithm` traces reach code paths outside the Undici handshake? Resolvable only by inspecting them in the GitHub UI.
