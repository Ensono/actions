## Context

The repository contains three Node 24 JavaScript actions and the shared `actions-lib-utils` package. Action build scripts first call `tsc --noEmit` and then esbuild with CommonJS output; the library emits JavaScript and declarations with `tsc`. Action bundles are checked in and CI requires rebuilding them to leave tracked files unchanged.

The shared Jest configuration uses the `ts-jest` ESM preset and transformer. Each workspace inherits it, runs Jest 30 with `NODE_OPTIONS=--experimental-vm-modules`, and retains package-specific coverage thresholds. Existing action tests use `jest.unstable_mockModule`, dynamic imports, and, in the setup action, `jest.spyOn`. These are migration-sensitive behaviors, not reasons to switch tests to CommonJS.

PR #11's latest inspected run passes installation, compilation, bundling, and integrity checking but fails in `ts-jest` initialization with zero tests executed. TypeScript 7 exposes a native executable without the JavaScript compiler API required by `ts-jest`; `ts-jest@29.4.14` still declares `typescript >=4.3 <7`.

Production TypeScript configurations exclude `**/*.test.ts`. Once transforms stop performing compiler diagnostics, a separate native check must explicitly include tests instead of merely reusing those excludes.

This proposal is on `chore/upgrade-typescript-7`, created from `origin/main` at `1a4e28f`, not from the failing Dependabot branch. Existing dependency-supply-chain and workflow-hardening specifications remain applicable. The repository currently has no ESLint or Oxlint dependency, configuration, or CI gate; this change now includes Oxlint adoption as hardening, not as a follow-up.

## Goals / Non-Goals

**Goals:**

- Use native TypeScript 7 directly for builds and authoritative source-and-test type-checking.
- Replace `ts-jest` with compiler-independent SWC transforms while preserving Jest's ESM semantics, assertions, mocks, reporting, and coverage gates.
- Explicitly target Node 24 in every action's esbuild command and retain reproducible checked-in outputs.
- Add an enforced, correctness-focused Oxlint baseline for authored TypeScript and JavaScript, including tests and tooling scripts.
- Ship a validated replacement PR superseding #11 without importing unrelated dependency updates.

**Non-Goals:**

- Adding ESLint, formatting rules, broad stylistic rule sets, or type-aware linting; Oxlint is included only as a correctness-focused hardening gate.
- Changing action inputs, outputs, Node runtime declarations or Jest major version. The maintainer explicitly approved aligning the package-manager version on pnpm 12.11.2 during implementation.
- Adding TypeScript 6 aliases, replacing Jest with another runner, or integrating unstable native compiler APIs.
- Broad source refactoring, unrelated dependency upgrades, changing Dependabot grouping, or weakening coverage/type/security checks.

## Decisions

### 1. Separate compiler checking from test transformation

Use `typescript` at a compatible stable 7.x release, `@swc/jest` as Jest's transformer, and `@swc/core` as its runtime. SWC parses/transforms TypeScript without importing the TypeScript compiler API. It does not type-check, and parser support for arbitrary future TypeScript features is not assumed.

Registry checks on 2026-10-12 identified TypeScript 7.0.2 and `@swc/jest` 0.2.39 as current eligible candidates. The latest `@swc/core` 1.16.18 was published on 2026-10-11 and is too new under the five-day policy; 1.16.13, published on 2026-09-30, is the newest eligible stable candidate at proposal time. These are planning evidence, not permission to skip registry, peer, engine, release-age, or security checks at implementation and pre-commit time.

Use pnpm 12.11.2 consistently in the repository and CI. npm confirms publication on 2026-10-09 at 17:35:58 UTC and Node >=18 support; on 2026-10-12 the maintainer explicitly approved a release-age exception for this pnpm version only. The five-day policy remains unchanged for every other dependency.

Use the pinned pnpm version, exact direct versions, package-manager-generated lockfile updates, suppressed install scripts, and the one-time `--config.minimumReleaseAge=7200` install flag. Do not persist the release-age setting. Review SWC package lifecycle requirements and permit only necessary build steps in the existing `allowBuilds` policy; execute dependency code in the established sandbox rather than granting blanket script execution.

Alternatives considered:

- **TypeScript 7 plus the official TypeScript 6 compatibility aliases:** supported by ts-jest but retains two compiler versions and divergent diagnostics. This is a fallback approach, not this change's implementation.
- **babel-jest with the TypeScript preset:** established, but introduces Babel configuration without an existing Babel pipeline to reuse.
- **Bypassing ts-jest's peer range or setting its compiler to native TypeScript:** rejected because neither provides the missing API.

### 2. Preserve the existing Jest ESM model

Replace the shared preset/transform configuration with a focused inline SWC configuration: TypeScript parsing, ESM output, source maps, and a JavaScript target compatible with Node 24. Retain `extensionsToTreatAsEsm`, the experimental VM-module invocation, test discovery, reporters, and all package overrides. Do not introduce a CommonJS transform as a shortcut around ESM mocking.

Remove `ts-jest` and its obsolete configuration. Audit `ts-node` references and remove the direct dependency only if it is unused; JavaScript Jest configuration does not itself justify keeping a TypeScript config loader. Audit any other dependencies made obsolete by this migration without sweeping unrelated dependencies away.

An inline Jest-specific configuration is preferred to a broad `.swcrc` because the repository's production bundler remains esbuild. Source maps and coverage behavior must be validated through the existing tests, not inferred from a successful transform.

### 3. Add a native source-and-test type-check gate

Expose a root `pnpm run typecheck` command backed by native `tsc --noEmit`. Check production configurations across all four workspaces and use an explicit no-emit test-check configuration that includes their source and test files, overrides inherited test exclusions, and excludes generated bundles, declarations/output directories, dependencies, and coverage artifacts. It can build on `tsconfig.jest.json`, but must not leave a transformation-only configuration with no consumer.

Preserve compatible production/test module settings and explicit `.ts` import handling. Build shared-library declarations before dependent checks where repository imports require them. Wire the PR gate after the existing build/integrity stage and before tests, so the action bundle check remains untouched and native diagnostics are visible separately from Jest failures.

Correct newly exposed typing errors narrowly, preserving behavioral assertions. Do not disable diagnostics, add blanket casts, or relax existing checks to obtain a pass. Prove test inclusion with a temporary, deliberately ill-typed test that makes the command fail; remove the probe afterward.

### 4. Explicitly target the execution runtime in esbuild

Add `--target=node24` to the existing commands in `eirctl-setup/package.json`, `playground-echo/package.json`, and `process-json/package.json`. Preserve CommonJS output and existing generated-code banners. The TypeScript `target` is not the emitted syntax guarantee for these actions because esbuild emits the final bundles.

Do not change `runs.using: node24`. The compiler version is a build-time concern; consumers execute the bundled JavaScript. Syntax targeting does not polyfill runtime APIs, so representative action behavior must also be tested under Node 24.

### 5. Add Oxlint as an enforced hardening gate

Add an exact, registry-verified `oxlint` development dependency under the same release-age, engine, install-script, and lockfile policies as the compiler and SWC dependencies. Registry evidence on 2026-10-12 identifies Oxlint 1.87.0, published on 2026-10-05, as the current eligible stable candidate; its Node engine range `^20.19.0 || >=22.12.0` includes Node 24. Recheck this selection during implementation and before committing.

Create a focused root Oxlint configuration and `pnpm run lint` command that cover authored workspace TypeScript source and tests, plus maintained JavaScript such as Jest configuration, test setup helpers, and the coverage-report script. Inventory these files before choosing include/ignore patterns. Explicitly exclude dependency directories, generated `task.js` bundles, emitted library/build outputs, and coverage artifacts. Do not ignore authored tests or tooling just to avoid initial findings.

Start with Oxlint's standard correctness rules, not all categories or type-aware linting. Configure the known Node and Jest environments appropriately and document any narrowly scoped, evidence-backed rule exceptions; do not use blanket disables or blanket ignore patterns to obtain a pass. Fix baseline findings with the smallest behavior-preserving changes and rerun affected checks. Oxlint complements native TypeScript 7 checking; it does not replace it or promise exhaustive security analysis.

Make local linting and a distinct non-fixing PR workflow step fail on any error or warning, using the selected Oxlint version's supported CLI/configuration options. Run it after dependency installation and before tests without expanding workflow permissions. Establish the gate with a temporary known correctness violation in an authored file, verify a nonzero exit, restore the probe, and rerun lint successfully. Also verify a violation in a test file is detected and generated files are excluded.

Alternatives considered: deferring linting would leave this migration without a source-lint gate and no longer matches the requested scope; ESLint adds a different plugin/configuration stack with no existing configuration to preserve; broad stylistic rules or type-aware linting would expand migration risk beyond this bounded hardening step.

### 6. Deliver one replacement implementation PR

Document the local command sequence and distinct tool responsibilities, including Oxlint's correctness gate. Evaluate OpenSpec sync/archive timing before opening the replacement PR. Prefer syncing and archiving a genuinely completed change, but keep it active while required delivery tasks remain incomplete; do not archive an unfinished checklist merely to open the PR. If implementation spans multiple PRs, define the remaining scope as a follow-up change.

Open the PR from `chore/upgrade-typescript-7` to `main`, explicitly stating that it supersedes #11 and explaining the compiler-API incompatibility. Opening this PR is an implementation-delivery task, not part of proposal creation. Coordinate disposition of #11 after the replacement exists; do not close it automatically during planning or enable an unvalidated replacement for merge.

## Risks / Trade-offs

- [SWC transforms do not check types] → Require a native TS7 source-and-test check locally and in CI; prove inclusion with a negative test-file probe.
- [ESM imports or mocks change behavior] → Preserve ESM execution and run all suites, especially `unstable_mockModule`, dynamic-import, and spy behavior; add focused regressions where coverage is insufficient.
- [Source-map or coverage instrumentation differs] → Retain thresholds and assertions; investigate differences and validate line mapping rather than lowering gates.
- [Native SWC or Oxlint installation varies by platform] → Verify supported developer/CI platforms and engines, review lifecycle needs, and test a clean frozen install with the chosen allowlist.
- [The dependency release-age window changes] → Requery npm at implementation and before committing; document any compatibility constraint under the existing policy.
- [TypeScript 7 exposes previously unchecked test errors] → Fix types narrowly; do not substitute successful Jest execution for native type-checking.
- [Node targeting is mistaken for API compatibility] → Execute representative runtime checks under Node 24 and preserve existing action integration tests.
- [Regenerated outputs differ] → Review generated changes and rebuild twice; only commit reproducible outputs required by the source/dependency change.
- [Initial lint findings expand scope or alter behavior] → Restrict the baseline to correctness rules, fix authored code narrowly, and rerun affected tests; do not weaken assertions or blanket-suppress findings.
- [Lint patterns miss authored files or include generated code] → Inventory input files and verify negative probes in both source and tests while confirming generated output exclusions.

## Implementation-approved validation refinements

The maintainer approved a parent-scoped `@istanbuljs/load-nyc-config>js-yaml` override to 5.4.3 after audit identified vulnerable `sprintf-js` through js-yaml 3 / argparse 1. The selected stable release satisfies the five-day policy. Static inspection confirms the loader uses only `load()`; isolated compatibility checks cover valid YAML and parse failure. Full tests, native checking, coverage, clean installation, and audit must be rerun; this is not an advisory suppression or a blanket override.

GitHub's official permission documentation includes `code-quality`, but latest actionlint 1.7.12 rejects it. The maintainer approved a temporary compatibility build from pinned upstream source, changing only its known-scope table to recognize that documented scope. Preserve all other permission/value checks and workflow validation; record the exact source revision, patch, and negative probes, and explicitly distinguish this build from unmodified upstream actionlint. Do not remove the legitimate permission or ignore its diagnostic. No repository runtime toolchain dependency is added by this local validation build.

## Migration Plan

1. Verify clean branch state, establish the `main` baseline in an isolated Node 24 environment, and refresh dependency evidence.
2. Install the scoped compiler/transformer and Oxlint dependencies, remove obsolete dependencies, and update shared ESM transform configuration.
3. Add native production/test checks and the correctness-focused Oxlint baseline, correct relevant typing/interop/lint findings, and update CI and developer guidance.
4. Add explicit esbuild targets, regenerate outputs, and run frozen-install, lint, type-check, test/coverage, audit, workflow, runtime, and reproducibility checks.
5. Validate OpenSpec artifacts, evaluate sync/archive timing without hiding incomplete delivery tasks, then commit/push and open the replacement PR. Sync/archive once the change is genuinely complete. Any configured pre-commit checks must run; signing failures require operator retry, not bypassing signing.

Rollback restores the previous compiler, transformer, lint integration, configuration, lockfile, and generated outputs together. If ESM semantics or required checks cannot be preserved, stop with the blocker documented rather than silently reverting only part of the migration or weakening gates.

## Open Questions

No product decisions block implementation. Resolve these evidence questions during execution: exact eligible dependency versions, SWC/Oxlint lifecycle/platform requirements, whether `ts-node` has any real consumer, authored-file lint coverage and narrowly justified rule exceptions, and the minimal typing fixes revealed by native checking of the existing test files.

References: [SWC Jest guide](https://swc.rs/docs/usage/jest), [Jest TypeScript guide](https://jestjs.io/docs/getting-started#using-typescript), [ts-jest TypeScript 7 transition guide](https://github.com/kulshekhar/ts-jest/blob/v29.4.14/website/docs/guides/typescript-7.md), and [PR #11 failing run](https://github.com/Ensono/actions/actions/runs/38224544883).
