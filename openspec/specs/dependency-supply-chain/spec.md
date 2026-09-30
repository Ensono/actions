# Dependency Supply Chain Specification

## Purpose

Select compatible, mature dependencies and verify the lockfile and checked-in action bundles.

## Requirements

### Requirement: Direct dependency version selection policy
Every direct dependency version declared in `package.json` (root or workspace package) SHALL be the latest stable release published at least five days before selection, unless a documented compatibility constraint forces an older version.

#### Scenario: Latest stable release is old enough
- **WHEN** a direct dependency's latest stable release was published five or more days ago
- **THEN** that version SHALL be the declared version

#### Scenario: Latest stable release is too new
- **WHEN** a direct dependency's latest stable release is less than five days old
- **THEN** the most recent stable release that is at least five days old SHALL be declared instead

#### Scenario: Compatibility constraint blocks the latest release
- **WHEN** the latest aged stable release violates a peer-dependency range or the action's Node runtime line
- **THEN** the selected version SHALL be the newest compatible release AND the constraint SHALL be recorded in `SECURITY-REMEDIATION.md`

#### Scenario: Prerelease versions
- **WHEN** a dependency's newest published version is a prerelease
- **THEN** it SHALL NOT be selected

### Requirement: Release-age delay is never persisted
The minimum-release-age delay SHALL be supplied as a one-time install flag and SHALL NOT be written into `package.json`, `.npmrc`, `pnpm-workspace.yaml`, or any other checked-in configuration.

#### Scenario: Regenerating the lockfile
- **WHEN** the lockfile is regenerated with the release-age policy in force
- **THEN** the delay SHALL be passed as `--config.minimumReleaseAge=7200` on the command line only

#### Scenario: Urgent security patch is published
- **WHEN** a security patch newer than five days old must be installed
- **THEN** no checked-in configuration SHALL block its installation

### Requirement: Lockfile contains no known-vulnerable versions
`pnpm-lock.yaml` SHALL resolve no package version that matches a known vulnerable range reported for this repository.

#### Scenario: Lockfile regenerated
- **WHEN** `pnpm-lock.yaml` is regenerated and deduped on the pinned pnpm version
- **THEN** semver comparison against every open Dependabot alert range SHALL produce zero matches

#### Scenario: Audit gate
- **WHEN** `pnpm audit --json` is run against the regenerated lockfile
- **THEN** it SHALL report zero vulnerabilities

#### Scenario: Frozen install verification
- **WHEN** `pnpm install --frozen-lockfile` is run on the pinned pnpm version
- **THEN** it SHALL succeed without modifying the lockfile

### Requirement: Checked-in action bundles are reproducible
The committed `*/task.js` bundles SHALL be byte-identical to the output of `pnpm run build` against the committed lockfile.

#### Scenario: Dependencies change
- **WHEN** `pnpm-lock.yaml` or any source file changes
- **THEN** the bundles SHALL be rebuilt and committed in the same change

#### Scenario: CI integrity check
- **WHEN** the PR workflow runs `pnpm i && pnpm run build`
- **THEN** `git status --porcelain --untracked-files=no` SHALL report an empty tree

### Requirement: Package manager version is declared
The repository SHALL declare the pnpm version it is built with so that CI, local development, and Dependabot resolve the same package manager.

#### Scenario: Dependabot resolves the manager
- **WHEN** Dependabot opens an npm ecosystem update
- **THEN** it SHALL use the pnpm version declared in `package.json` `engines.pnpm`

#### Scenario: CI alignment
- **WHEN** the declared pnpm version changes
- **THEN** the version installed by the CI workflows SHALL be updated to match
