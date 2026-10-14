## ADDED Requirements

### Requirement: Package-manager alignment uses the approved pnpm version

Repository and CI package-manager pins SHALL use pnpm 12.11.2. The maintainer-approved exception to the five-day release-age policy SHALL apply only to pnpm 12.11.2 and SHALL be documented in `SECURITY-REMEDIATION.md`; all other dependency selections SHALL retain the existing policy.

#### Scenario: Local and CI package-manager selection

- **WHEN** this migration is installed or validated locally or in CI
- **THEN** the declared and executed pnpm version SHALL be 12.11.2
- **AND** dependency lifecycle scripts SHALL remain suppressed during host-side dependency resolution

### Requirement: Native TypeScript 7 is the authoritative compiler

The repository SHALL use a compatible stable TypeScript 7 release for project compilation and type-checking. Jest transformation SHALL NOT depend on the TypeScript compiler's JavaScript API or require a TypeScript 6 compatibility compiler. Dependency selection and installation SHALL comply with the existing dependency-supply-chain requirements.

#### Scenario: Compiler version selection

- **WHEN** dependencies are selected for this migration
- **THEN** the declared `typescript` version SHALL be a registry-verified stable 7.x release compatible with the project and selected under the existing release-age policy
- **AND** the pinned package manager SHALL generate the lockfile without hand editing or bypassing peer checks

#### Scenario: Compiler-independent Jest initialization

- **WHEN** Jest starts with the committed dependency installation
- **THEN** it SHALL transform TypeScript tests through SWC without importing the TypeScript 7 package as a JavaScript compiler library
- **AND** initialization SHALL NOT require installing the TypeScript 6 compatibility aliases

### Requirement: Native type-checking covers production source and tests

The root package SHALL expose `pnpm run typecheck`, invoking native TypeScript 7 no-emit checking of production source and test files across `actions-lib-utils`, `eirctl-setup`, `playground-echo`, and `process-json`. Generated bundles, build outputs, coverage artifacts, and dependency directories SHALL be excluded. Test files SHALL NOT remain excluded through inherited production configuration.

#### Scenario: All workspace inputs are checked

- **WHEN** a developer runs `pnpm run typecheck` after installing dependencies and building any required workspace declarations
- **THEN** native TypeScript 7 SHALL check production source and all discovered workspace test files without emitting additional files

#### Scenario: A test contains a type error

- **WHEN** a deliberately ill-typed expression is introduced into a workspace test file
- **THEN** `pnpm run typecheck` SHALL fail with a nonzero exit status and a diagnostic identifying that file
- **AND** a successful Jest transform SHALL NOT conceal or override that failure

#### Scenario: Generated output exists

- **WHEN** checked-in bundles, emitted library files, or coverage artifacts exist
- **THEN** the source-and-test check SHALL NOT treat them as additional source inputs

### Requirement: SWC preserves the Jest ESM execution contract

The shared Jest configuration SHALL use `@swc/jest` with TypeScript parsing, ESM-compatible output, and source-map support. Existing test discovery, ESM execution, module mocking, and behavioral assertions SHALL remain intact across every workspace.

#### Scenario: All existing suites execute

- **WHEN** `pnpm run test` runs under Node 24
- **THEN** every existing workspace suite SHALL execute successfully with no transformer initialization failures or newly skipped tests

#### Scenario: ESM mocks and imports

- **WHEN** a test registers `jest.unstable_mockModule` and dynamically imports the module under test
- **THEN** the imported module SHALL observe the intended mock implementation and existing assertions SHALL retain their meaning

#### Scenario: Obsolete transformer integration

- **WHEN** the migration is complete
- **THEN** direct `ts-jest` dependencies, presets, and transformer configuration SHALL be absent
- **AND** any other dependency or configuration made obsolete by this change SHALL be removed only after its consumers have been checked

### Requirement: Coverage and reporting safeguards remain effective

The migration SHALL retain existing global and package-specific coverage thresholds, JUnit reporting, and coverage merge output. Transformer differences SHALL NOT be accommodated by weakening assertions, reducing thresholds, or excluding previously covered production source.

#### Scenario: Coverage pipeline succeeds

- **WHEN** the complete test and coverage-merge commands run
- **THEN** all existing coverage gates SHALL pass and the existing JUnit and merged coverage artifacts SHALL be produced

#### Scenario: Coverage behavior changes

- **WHEN** SWC transformation changes reported coverage or stack locations
- **THEN** the discrepancy SHALL be investigated and corrected without lowering established coverage thresholds or suppressing relevant checks

### Requirement: Action bundles explicitly target Node 24

Every esbuild action-bundling command SHALL include `--target=node24` while preserving its existing CommonJS format and generated-code banner where present. Action metadata SHALL continue to declare `using: node24`. Checked-in bundles and required library outputs SHALL remain reproducible under the committed lockfile.

#### Scenario: Each action is bundled

- **WHEN** `eirctl-setup`, `playground-echo`, or `process-json` is built
- **THEN** its esbuild invocation SHALL explicitly target Node 24
- **AND** the resulting action SHALL preserve existing inputs, outputs, and behavior under Node 24

#### Scenario: Rebuilding committed outputs

- **WHEN** the full build is repeated using a clean installation of the committed lockfile
- **THEN** rebuilding SHALL leave tracked generated files unchanged

### Requirement: Oxlint enforces a correctness-focused hardening baseline

The repository SHALL declare a compatible, registry-verified stable `oxlint` development dependency selected under the existing dependency-supply-chain policy. It SHALL expose a root `pnpm run lint` command with a checked-in, correctness-focused configuration covering authored workspace TypeScript source and tests, plus maintained JavaScript tooling and configuration. Type-aware linting and formatting migration SHALL remain outside this change. Oxlint SHALL complement, not replace, native TypeScript 7 checking.

#### Scenario: Authored code is linted

- **WHEN** a contributor runs `pnpm run lint`
- **THEN** Oxlint SHALL check authored source, workspace tests, and maintained JavaScript tooling/configuration with appropriate Node and Jest environments
- **AND** the command SHALL succeed only when there are zero errors and zero warnings

#### Scenario: A correctness violation is introduced

- **WHEN** a temporary known violation of an enabled correctness rule is introduced into an authored source or test file
- **THEN** `pnpm run lint` SHALL return a nonzero exit status with a diagnostic identifying the violation
- **AND** source and test negative probes SHALL each demonstrate that the relevant files are checked

#### Scenario: Generated artifacts exist

- **WHEN** generated action bundles, emitted library/build outputs, dependency directories, or coverage artifacts exist
- **THEN** lint selection SHALL exclude those artifacts without excluding authored source, tests, or maintained tooling scripts

#### Scenario: Baseline findings need correction

- **WHEN** the initial lint run reports findings
- **THEN** fixes SHALL preserve behavior, assertions, and existing validation gates
- **AND** any rule exception SHALL be narrowly scoped and documented with a concrete rationale rather than disabling rules or ignoring files broadly to obtain a pass

### Requirement: CI distinguishes linting, type-checking, and runtime testing

The PR workflow SHALL enforce native source-and-test type-checking as a distinct failing gate after required workspace build outputs are available and before Jest tests. It SHALL also run Oxlint as a distinct non-fixing gate after dependency installation and before tests, failing on any error or warning. Existing build integrity, test, coverage, and workflow security safeguards SHALL remain in force.

#### Scenario: Native checking fails in CI

- **WHEN** the source-and-test check reports an error
- **THEN** the PR check SHALL fail even if the code can be transpiled by SWC

#### Scenario: Linting fails in CI

- **WHEN** Oxlint reports an error or warning
- **THEN** the PR check SHALL fail even if native type-checking and runtime tests would otherwise pass
- **AND** CI SHALL NOT automatically fix or silently suppress the finding

#### Scenario: Supported installation and execution

- **WHEN** CI performs a frozen installation using the declared pnpm version and runs validation under Node 24
- **THEN** dependencies SHALL install successfully without changing the lockfile and the build, lint, native checks, tests, and coverage merge SHALL pass
- **AND** no expanded workflow permissions or blanket dependency-script permissions SHALL be introduced to obtain a pass

### Requirement: Developer guidance separates tool responsibilities

The repository SHALL document TypeScript 7 as the authoritative type checker, SWC as the Jest transformer, Jest as the runtime test runner, Oxlint as the correctness-focused source linter, and esbuild as the Node 24 action bundler. Local verification instructions SHALL include build, lint, native type-check, test, and coverage-merge commands and explain the linter's file scope and any justified rule exceptions.

#### Scenario: A contributor validates a change

- **WHEN** a contributor follows the documented local verification sequence
- **THEN** the sequence SHALL exercise linting, native source-and-test checking, runtime tests, and coverage
- **AND** the documentation SHALL NOT imply that SWC performs type-checking, that Oxlint replaces native compiler checking, or that action consumers execute the TypeScript compiler
