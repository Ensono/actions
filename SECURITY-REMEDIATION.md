# Security remediation record

## TypeScript toolchain migration (2026-10-12 UTC)

The maintainer explicitly requested pnpm 12.11.2 for this change and approved a release-age exception limited to that package-manager version. npm's authoritative registry confirms 12.11.2 is the latest stable release, published 2026-10-09 at 17:35:58.676 UTC, with Node `>=18.*` support (including Node 24). Repository and PR CI pins are aligned on 12.11.2. This does not waive the five-day policy for any other dependency. Host-side installation suppresses lifecycle scripts; dependency execution remains isolated with no network or credentials.

### Migration dependency selection

Authoritative npm registry checks on 2026-10-12 selected exact stable versions:

| Package | Selected | Published (UTC) | Runtime / peers |
| --- | --- | --- | --- |
| `typescript` | 7.0.2 | 2026-07-08 15:55 | Node >=16.20.0; native platform packages |
| `@swc/jest` | 0.2.39 | 2025-07-09 05:43 | npm >=7; `@swc/core: *`; Jest cache-key helper ^30 |
| `@swc/core` | 1.16.13 | 2026-09-30 09:51 | Node >=10; optional helpers peer >=0.5.17 |
| `oxlint` | 1.87.0 | 2026-10-05 11:05 | Node ^20.19.0 or >=22.12.0; optional vite-plus/type-aware peers |

All support Node 24 and meet the five-day policy. SWC core's latest 1.16.18 was published less than five days before selection, so 1.16.13 is the newest eligible stable release. No TypeScript compatibility compiler or Oxlint type-aware peer is required. TypeScript, SWC, and Oxlint publish Linux x64 native packages for the CI platform. Only SWC core declares an install lifecycle hook (`node postinstall.js`); installation suppresses that hook pending static review and isolated native-binding verification. No additional compatibility constraint forces an older eligible version.

SWC's reviewed postinstall validates the native binding but can run `npm install` for an untracked WASM fallback if loading fails. On Linux x64/glibc, isolated Node 24 execution loaded its optional native package and transformed TypeScript successfully without that hook. Oxlint 1.87.0 and native TypeScript 7.0.2 also executed successfully after script-suppressed installation. `allowBuilds` explicitly denies SWC's unnecessary hook; no new build-script permission or WASM fallback is required.

### Migration validation and resolved findings

With Node 24.20.0 and pnpm 12.11.2, the migrated toolchain passed build, lint (22 authored files, zero errors/warnings), native production/test checking, all four Jest suites (49 tests, none skipped), and coverage merge. The additional test verifies an error stack's exact original TypeScript line. All four test-file type probes failed with TS2322; source/test lint probes failed with `no-unused-vars`; every probe was restored. JUnit files and merged HTML/Cobertura outputs were verified. No coverage thresholds, diagnostics, or lint rules were suppressed.

A separate clean installation with `--frozen-lockfile --ignore-scripts --config.minimumReleaseAge=7200` left the lockfile hash unchanged and passed the same isolated Node 24 validation. Linux x64/glibc native packages and esbuild worked without lifecycle hooks. Two subsequent builds were byte-identical, and clean-install action/library outputs matched the working tree. Only `eirctl-setup/task.js` changed, reflecting the two behavior-preserving lint fixes. Controlled bundled-action checks passed for plain JSON outputs, Terraform outputs/masking, echo input parsing, and checksum-required rejection before setup download; no network or credentials were available.

**Security remediation (2026-10-12):** initial audit reported moderate [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) for `sprintf-js` 1.0.3 (vulnerable `<=1.1.3`), reached through Jest's Babel instrumentation → `@istanbuljs/load-nyc-config` 1.1.0 → js-yaml 3 → argparse 1. npm has no patched sprintf-js release. The maintainer approved only the parent-scoped `@istanbuljs/load-nyc-config>js-yaml: 5.4.3` override in `pnpm-workspace.yaml`; this latest stable release was published 2026-10-05 at 22:13:55.389 UTC and meets the age policy. It removes the old argparse/sprintf-js chain. The NYC loader uses only `load()`, which remains exported as CommonJS; isolated loader checks verified valid YAML and invalid-YAML rejection. This deliberately crosses the parent's declared major range, limited to its verified API consumer, not all js-yaml consumers. Full Node 24 build/lint/type-check/tests/coverage passed again; audit then exited zero with zero vulnerabilities. GitHub lists one open npm alert with the same sprintf-js range; semver comparison found zero lockfile matches. The default-branch alert is not claimed closed before merge.

**Workflow validator compatibility:** installed/latest upstream actionlint 1.7.12 rejects the pre-existing `code-quality: write` permission at `.github/workflows/pr.yml:13`. GitHub's official `github/docs` file `data/reusables/actions/github-token-available-permissions.md` confirms `code-quality: read|write|none`. The maintainer approved a temporary compatibility build of actionlint tag v1.7.12, pinned revision `914e7df21a07ef503a81201c76d2b11c789d3fca`, with exactly one addition to `rule_permissions.go`'s `allPermissionScopes` map:

```go
"code-quality": {"read", "write", "none"},
```

The pristine source and system binary were untouched; the patch was applied only to a disposable copy. Source entry points, module metadata, permission logic, and external-command paths were statically inspected before the approved build handoff (not a full safety certification). Pinned modules were downloaded on the host; compilation ran offline in Bubblewrap with read-only source/module cache, a writable output directory, `CGO_ENABLED=0`, `GOTOOLCHAIN=local`, `GOPROXY=off`, and `go build -mod=readonly -buildvcs=false -o out/actionlint ./cmd/actionlint`. The local Linux x64 binary SHA-256 is `0a47b645c6a70151c1bb4f0b5be3b61796ee500b00b635c85d2bcfc38d528fe5`. That compatibility binary passed all workflows with ShellCheck enabled. Negative probes confirmed rejection of an unknown permission, `code-quality: admin`, and malformed shell syntax. No permission was removed, validation rule disabled, or diagnostic ignored. **Unmodified upstream actionlint still fails this valid scope**; the compatibility result must not be reported as an unmodified upstream pass. Remove the local compatibility need when upstream recognizes the documented scope.

After remediation, a second clean frozen installation using the exact CI command (`--frozen-lockfile --ignore-scripts`, default age configuration) left the lockfile unchanged and passed bare build/lint/typecheck/test/test:merge commands under Node 24 with strict pre-run verification. Two final rebuilds and the clean build produced identical action/library outputs. Pre-commit npm checks reconfirmed all selected migration dependencies remain the latest eligible stable versions; only pnpm 12.11.2 uses the separately approved age exception.

### Migration baseline

Before compiler/transformer changes, Node 24.20.0 and pnpm 12.11.2 passed `build`, all four Jest suites (48 tests), and `test:merge`; tracked generated outputs remained unchanged. Bubblewrap disabled network and credential access. Build/report destinations were writable; `process-json` additionally required temporary fixture creation in its root, with authored source/configuration and committed fixtures mounted read-only. Initial read-only fixture failures were sandbox setup issues, not source failures.

pnpm 12.11.2 no longer reads the obsolete empty `pnpm.overrides` block, which was removed. Installation with `--ignore-scripts --config.minimumReleaseAge=7200` succeeded without changing the lockfile. Its new pre-run dependency verification also compares release-age configuration, so isolated baseline runs supplied the same one-time flag and `--config.verifyDepsBeforeRun=error` through a temporary launcher. Neither setting was persisted and dependency verification was not disabled.

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
