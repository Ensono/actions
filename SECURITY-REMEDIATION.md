# Security remediation record

## Direct dependency selection (2026-09-29 UTC)

Select the newest stable npm release published at least five days before selection (cutoff: 2026-09-24 09:30 UTC), subject to peer and runtime compatibility. Do not select prereleases. The 7,200-minute pnpm release-age setting was supplied only on the lockfile regeneration command; it is not persisted, so urgent security fixes are not delayed by local package-manager configuration. Dependabot's separate five-day cooldown applies to **version updates only**; security updates are deliberately immediate.

The npm registry was checked for every external direct dependency in the root and four workspace manifests. Selected versions (and their npm publish dates) were:

| Package | Selected | Published (UTC) |
| --- | --- | --- |
| `@actions/github` | 9.1.1 | 2026-04-21 |
| `@actions/core` | 3.0.1 | 2026-04-21 |
| `@actions/io` | 3.0.2 | 2026-01-28 |
| `@actions/tool-cache` | 4.0.0 | 2026-01-29 |
| `@jest/globals` | 30.5.2 | 2026-09-18 |
| `@types/jest` | 30.0.0 | 2025-06-16 |
| `@types/node` | 24.13.6 | 2026-09-19 |
| `esbuild` | 0.28.2 | 2026-08-08 |
| `istanbul-lib-coverage` | 3.2.2 | 2023-11-08 |
| `istanbul-lib-report` | 3.0.1 | 2023-07-25 |
| `istanbul-merge` | 2.0.0 | 2023-03-28 |
| `istanbul-reports` | 3.2.0 | 2025-08-18 |
| `jest` | 30.5.2 | 2026-09-18 |
| `jest-junit` | 17.0.0 | 2026-04-24 |
| `jest-mock` | 30.5.2 | 2026-09-18 |
| `ts-jest` | 29.4.13 | 2026-09-23 |
| `ts-node` | 10.9.2 | 2023-12-08 |
| `typescript` | 6.0.3 | 2026-04-16 |

Exceptions and age decisions:

- `typescript` 7.0.2 was old enough but violates `ts-jest` 29.4.13's `typescript: >=4.3 <7` peer range. 6.0.3 is the newest compatible stable release.
- `@types/node` tracks the Node 24 action/CI runtime, not the newest Node 26 typings. 24.13.6 is the newest release on the Node 24 line old enough at selection time (the manifest preserves its existing tilde-range convention).
- `ts-jest` 29.4.14 was published on 2026-09-25 and was not yet five days old; 29.4.13 was selected. Similarly, `@types/node` 26.6.3 was published on 2026-09-25 but is excluded by the runtime-line constraint.
- Workspace-local `@ensono-actions-lib/utils` uses `workspace:^`, not an npm-published release.

## Local verification evidence

Run with npm's `pnpm@12.6.0` executable (CI also installs 12.6.0; `engines.pnpm` declares it):

- `pnpm add -Dw --save-exact @types/node@24.13.6 --config.minimumReleaseAge=7200`, then `pnpm install --lockfile-only --force --config.minimumReleaseAge=7200` and `pnpm dedupe --config.minimumReleaseAge=7200` succeeded. pnpm kept the pre-existing `~` prefix on `@types/node`. `pnpm.overrides` remains empty; no minimum-release-age setting was committed.
- `pnpm run build` succeeded; all three checked-in `*/task.js` bundles remained unchanged. `pnpm run test` passed 46 tests across four suites; `pnpm run test:merge` succeeded. These local runs used Node 26.4.0; PR CI uses Node 24.
- `pnpm install --frozen-lockfile --config.minimumReleaseAge=7200` succeeded, and the lockfile SHA-256 was unchanged. `pnpm audit --json` returned zero info, low, moderate, high, and critical vulnerabilities.
- On 2026-09-29, the GitHub Dependabot API listed 30 open alerts. Comparing every alert's vulnerable-version range with all package versions in `pnpm-lock.yaml` using `semver.satisfies` returned **zero matches**; `braces` is absent. This verifies the lockfile graph, not closure of alerts on the default branch.
- `actionlint .github/workflows/*.yml` and `git diff --check` both exited zero. `tester.yml` now declares `contents: read`, uses the repository's SHA-pinned checkout, and has no empty `env` map; the release quoting and PR shellcheck findings are corrected.
- `.github/dependabot.yml` parses as YAML. Its weekly npm and GitHub Actions schedules, three distinct npm groups (production/development version updates and security updates), one Actions group, and five-day version-update cooldown were checked against the [GitHub Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).

**Unverified Dependabot compatibility:** the same GitHub reference currently lists pnpm support through v10, while this repository uses pnpm 12.6.0. Declaring `engines.pnpm` and validating YAML cannot demonstrate that hosted Dependabot resolves pnpm 12 or updates this lockfile. Inspect the first live npm update run and its log after merging; investigate manager mismatches or `security_update_not_possible` rather than assuming the configuration fixes them.

## CodeQL triage

Three `js/weak-cryptographic-algorithm` alerts concern bundled Undici WebSocket code. For [#4](https://github.com/Ensono/actions/security/code-scanning/4) (`playground-echo/task.js:16673`), [#5](https://github.com/Ensono/actions/security/code-scanning/5) (`eirctl-setup/task.js:16675`), and [#6](https://github.com/Ensono/actions/security/code-scanning/6) (`process-json/task.js:16675`), the GitHub API alert instances point to the same handshake check: `crypto.createHash("sha1").update(keyValue + uid).digest("base64")` for `Sec-WebSocket-Accept`. Inspection of each corresponding file on `main` via `gh api` confirmed that `uid` is the fixed public RFC 6455 GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`. This is protocol handshake material, **not secret data**; RFC 6455 requires SHA-1. Substituting SHA-256 would break protocol conformance and is rejected.

On 2026-09-29, the maintainer explicitly authorized an exception to the planned full GitHub UI trace review for these **three specific alerts**, accepting the `gh` alert-instance locations and inspected `main` source instead. Full UI traces were **not** reviewed; the GitHub API did not provide them. Alerts #4, #5, and #6 were each dismissed using `gh api` as `false positive`, verified by a subsequent GET (dismissed at 09:57:39Z, 09:57:40Z, and 09:57:41Z respectively), with this same comment:

> False positive: Undici's RFC 6455 WebSocket handshake requires SHA-1 over Sec-WebSocket-Key + public GUID 258EAFA5-E914-47DA-95CA-C5AB0DC85B11 for Sec-WebSocket-Accept. Not a secret; SHA-256 would break the protocol. Verified on main.

Do not generalize this exception to other alerts. If a later trace or rerun identifies a different path, reopen and investigate it.

## After merge (pending)

On `main`, re-check which of the 30 Dependabot alerts closed and which remain; confirm CodeQL closes the three `actions/missing-workflow-permissions` alerts. Record any remaining alerts and follow-up actions here. Retry the previously failed Dependabot security-update runs, record each outcome, and investigate any continuing `security_update_not_possible` errors. PR #7's [build-and-test run](https://github.com/Ensono/actions/actions/runs/36551141641) passed its build-integrity, test, and coverage upload steps on Node 24 before merge; this does not establish post-merge alert closure.
