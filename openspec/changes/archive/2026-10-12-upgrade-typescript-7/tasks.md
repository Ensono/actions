## 1. Establish the baseline and select dependencies

- [x] 1.1 Confirm implementation is on `chore/upgrade-typescript-7`, based on current `main`; preserve unrelated work and do not cherry-pick PR #11's incompatible lockfile.
- [x] 1.2 Align repository and CI pnpm pins on 12.11.2, recording the maintainer-approved pnpm-only release-age exception; establish the main-branch build, test, and coverage baseline under Node 24 in the approved sandbox; record any pre-existing failures before making changes.
- [x] 1.3 Query npm for current stable TypeScript 7, `@swc/jest`, `@swc/core`, and `oxlint` versions, publication times, engines, peers, and lifecycle requirements; select compatible versions under the existing five-day policy and record any compatibility constraint in `SECURITY-REMEDIATION.md`.
- [x] 1.4 Inspect compiler/transformer consumers and existing ESM mock/import behavior; identify whether `ts-node` or any transformer-only configuration has another required consumer.

## 2. Replace the test transformer

- [x] 2.1 Use pinned pnpm to install exact eligible TypeScript 7, SWC, and Oxlint direct dependencies and remove `ts-jest`, with install scripts suppressed and `--config.minimumReleaseAge=7200` supplied only on the command line; regenerate the lockfile through pnpm.
- [x] 2.2 Review and validate required SWC and Oxlint native installation/build steps, adding only narrowly necessary `allowBuilds` entries if needed and running dependency code in the approved sandbox; do not enable scripts globally.
- [x] 2.3 Replace the shared ts-jest preset and transform with inline SWC TypeScript parsing, ESM output, Node-24-compatible syntax, and source maps; preserve test discovery, VM-module invocation, reporters, and workspace overrides.
- [x] 2.4 Remove dependencies and configuration proven obsolete by this migration, including `ts-node` only if unused; retain or repurpose `tsconfig.jest.json` when it serves the native test check.
- [x] 2.5 Run the narrowest transformer-sensitive suites first, then every workspace suite; preserve dynamic-import mocks and spy behavior and add focused regression tests where existing assertions do not cover migration risks.

## 3. Enforce native source-and-test type-checking

- [x] 3.1 Add native no-emit production checking across all four workspaces and an explicit source-and-test checking configuration that overrides inherited test exclusions and excludes generated/build/coverage/dependency artifacts.
- [x] 3.2 Expose root `pnpm run typecheck`, with any required shared-library declaration build ordering explicit; verify the native executable reports the selected TypeScript 7 version.
- [x] 3.3 Correct newly exposed test/source typing or module-interop errors narrowly, without disabling diagnostics, weakening assertions, or adding blanket casts.
- [x] 3.4 Verify compiler input enumeration includes all four existing test files and run temporary negative probes in each workspace's test file to prove a type error fails the check; restore all probes and rerun successfully.
- [x] 3.5 Add a distinct failing native type-check step to `.github/workflows/pr.yml` after required builds and before tests; retain integrity checks, least-privilege permissions, and reporting behavior.

## 4. Target Node 24 and document the pipeline

- [x] 4.1 Add `--target=node24` to esbuild commands in `eirctl-setup/package.json`, `playground-echo/package.json`, and `process-json/package.json`, preserving CommonJS output and existing banners.
- [x] 4.2 Confirm every action still declares `using: node24`; rebuild and review all changed committed action bundles and required shared-library outputs without unrelated generated-file churn.
- [x] 4.3 Update developer guidance with compiler/transformer/runner/linter/bundler responsibilities and the build, lint, type-check, test, and coverage-merge sequence; state that SWC does not type-check, Oxlint does not replace native checking, and lint hardening ships in this change. Document lint scope and justified exceptions after configuring the baseline.

## 5. Add the Oxlint hardening gate

- [x] 5.1 Inventory authored TypeScript and JavaScript, including every workspace's source/tests and maintained tooling/configuration; define explicit exclusions for generated action bundles, library/build outputs, dependencies, and coverage artifacts.
- [x] 5.2 Add a focused root Oxlint configuration and `pnpm run lint` command using standard correctness rules, appropriate Node/Jest environments, and failure on any error or warning; do not enable type-aware rules or a formatting migration.
- [x] 5.3 Fix initial findings with narrowly scoped, behavior-preserving changes and rerun affected type-checks/tests; document concrete reasons for any narrowly scoped rule exception rather than blanket-disabling rules or ignoring authored files.
- [x] 5.4 Prove lint coverage with temporary known correctness violations in authored source and test files, verify nonzero exits and useful diagnostics, restore probes, and rerun successfully; confirm generated artifacts are excluded.
- [x] 5.5 Add a distinct non-fixing Oxlint step to `.github/workflows/pr.yml` after installation and before tests; require zero errors/warnings and retain all existing integrity, type-check, coverage, and permission safeguards.

## 6. Validate the complete migration

- [x] 6.1 Verify a clean frozen installation with pinned pnpm and the reviewed dependency-script policy succeeds without changing the lockfile; run required build steps in isolation and check the supported CI platform.
- [x] 6.2 Run `pnpm run lint`, native source-and-test checking, every Jest suite, and `pnpm run test:merge` under Node 24; confirm no newly skipped tests, unchanged coverage thresholds, JUnit files, and merged coverage artifacts.
- [x] 6.3 Verify source-map locations and representative ESM mock behavior; investigate instrumentation differences instead of reducing coverage gates or excluding source.
- [x] 6.4 Run representative bundled-action behavior checks under Node 24 with controlled inputs and no unintended external side effects; confirm inputs and outputs remain compatible.
- [x] 6.5 Rebuild twice against the committed lockfile and verify generated outputs are byte-identical; review the tracked diff for only intended source, configuration, dependency, documentation, and generated changes.
- [x] 6.6 Apply and validate the approved parent-scoped js-yaml 5.4.3 remediation, run `pnpm audit --json`, check applicable known-vulnerable ranges, and validate workflows with the approved pinned actionlint scope-compatibility build; record its exact patch and negative checks and the unmodified upstream limitation rather than bypassing security or validation controls.
- [x] 6.7 Reverify every newly added direct dependency against npm before committing, including latest eligible versions, age, engines, and peers; rerun affected checks if selections change.

## 7. Deliver the replacement PR

- [x] 7.1 Validate the OpenSpec change and assess sync/archive timing before PR creation; retain the active change while required delivery tasks remain incomplete, or define a follow-up change if scope is split.
- [x] 7.2 Run configured pre-commit checks if present, requesting hook installation where applicable; commit the scoped changes with signing intact and push `chore/upgrade-typescript-7` without force-pushing unrelated branches.
- [x] 7.3 Verify the intended GitHub host/account and open a replacement PR against `main` only after implementation and local validation; explicitly state that it supersedes #11 and include the contributing cause, selected architecture, lint/type-check/test evidence, and included Oxlint hardening scope.
- [x] 7.4 Inspect the replacement PR's checks and resolve migration-related failures; coordinate disposition of PR #11 after the replacement exists, rather than closing it during planning.
- [x] 7.5 Synchronize the completed delta specification and archive the genuinely completed change using the relevant OpenSpec workflows, ensuring the final delivery includes those artifacts without representing incomplete tasks as finished.
