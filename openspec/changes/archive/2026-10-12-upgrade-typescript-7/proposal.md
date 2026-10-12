## Why

PR #11 upgrades the root `typescript` dependency to 7.0.2, but Jest fails before executing tests because `ts-jest` requires the JavaScript compiler API that TypeScript 7 does not provide. Replace that compiler-dependent test transformer and explicitly target the actions' Node 24 runtime so the upgrade can ship with reliable type-checking, tests, coverage, and reproducible bundles. Add Oxlint as an enforced correctness-focused hardening gate in the same change.

## What Changes

- Align the repository and CI package-manager pins on pnpm 12.11.2, with the maintainer-approved release-age exception limited to that version.
- Upgrade to a registry-verified, compatible stable TypeScript 7 release and replace `ts-jest` with `@swc/jest` and `@swc/core`; select versions under the existing dependency release-age policy.
- Preserve the existing Jest 30 ESM execution model, workspace test suites, mocks, JUnit reporting, and coverage thresholds.
- Add an authoritative native TypeScript 7 `typecheck` command covering production source and every workspace's test files, and enforce it in the PR workflow independently of Jest transforms.
- Add `--target=node24` to all three esbuild action-bundling commands and regenerate checked-in build outputs.
- Add a registry-verified Oxlint development dependency, focused configuration, and root `lint` command covering authored TypeScript and JavaScript, including tests; exclude generated outputs and enforce zero errors or warnings in CI.
- Remove obsolete transformer configuration and compiler-dependent development dependencies only where repository evidence confirms they are unused.
- Remediate the discovered coverage-tooling `sprintf-js` advisory with a parent-scoped, API-verified js-yaml override; validate the official `code-quality` permission using a reviewed, pinned actionlint compatibility build while reporting the upstream validator limitation.
- Document the separated compiler, transformer, test-runner, linter, and bundler responsibilities and the local validation commands.
- Implement on `chore/upgrade-typescript-7`, branched from `main`. After implementation and validation, open a replacement PR that explicitly supersedes PR #11; do not close #11 during proposal creation.
- Keep Oxlint limited to correctness-focused, non-type-aware linting; no formatting migration, action input/output changes, Node runtime upgrade, Jest-major upgrade, or unrelated dependency updates are intended.

## Capabilities

### New Capabilities

- `typescript-toolchain`: A TypeScript 7 build and type-check pipeline with compiler-independent ESM Jest transformation, an enforced Oxlint correctness gate, unchanged behavioral/coverage safeguards, and explicit Node 24 action bundle targeting.

### Modified Capabilities

None. Existing dependency-supply-chain, workflow-hardening, and Dependabot requirements remain in force without modification.

## Impact

- Root `package.json`, `pnpm-lock.yaml`, shared Jest configuration, TypeScript checking configuration, new Oxlint configuration, and developer documentation.
- Build scripts in `eirctl-setup/package.json`, `playground-echo/package.json`, and `process-json/package.json`; generated action bundles and library outputs where the rebuild changes them.
- `.github/workflows/pr.yml`, adding distinct native type-check and Oxlint gates without expanding permissions or weakening the integrity check.
- Existing tests may need narrowly scoped typing or module-interop corrections exposed by native test type-checking or SWC; their behavioral assertions and coverage thresholds must remain intact.
- New development-only SWC and Oxlint dependencies; neither tool is required by consumers executing the committed action bundles. Authored code may need narrowly scoped lint corrections, but generated files must not be linted or edited to silence findings.
