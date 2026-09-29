## ADDED Requirements

### Requirement: Scheduled Dependabot version updates are configured
The repository SHALL contain `.github/dependabot.yml` configuring weekly version updates for the `npm` and `github-actions` ecosystems.

#### Scenario: Weekly npm schedule
- **WHEN** the configuration is evaluated
- **THEN** it SHALL define an `npm` ecosystem entry for the workspace root on a weekly schedule

#### Scenario: Weekly GitHub Actions schedule
- **WHEN** the configuration is evaluated
- **THEN** it SHALL define a `github-actions` ecosystem entry for `/` on a weekly schedule

#### Scenario: Configuration validity
- **WHEN** `.github/dependabot.yml` is committed
- **THEN** it SHALL be valid YAML accepted by Dependabot with no configuration error on the repository

### Requirement: Updates are grouped to limit pull request volume
Dependabot updates SHALL be grouped so that routine version bumps arrive as a small number of reviewable pull requests.

#### Scenario: npm version updates
- **WHEN** weekly npm version updates run
- **THEN** runtime dependencies and development dependencies SHALL be raised as two separate groups

#### Scenario: npm security updates
- **WHEN** npm security updates run
- **THEN** they SHALL be grouped separately from version updates so they are reviewable and mergeable independently

#### Scenario: GitHub Actions updates
- **WHEN** weekly Actions updates run
- **THEN** they SHALL be raised as a single group

### Requirement: Cooldown applies to version updates only
The configuration SHALL apply a five-day cooldown to version updates and SHALL NOT delay security updates.

#### Scenario: Routine version bump
- **WHEN** a new non-security release is published
- **THEN** Dependabot SHALL wait five days before proposing it

#### Scenario: Security fix published
- **WHEN** a security update is available
- **THEN** it SHALL be proposed immediately, because GitHub does not apply cooldown to security updates and immediate security updates are the chosen behaviour

#### Scenario: Attempting to delay security updates
- **WHEN** a delay on security updates is considered
- **THEN** disabling Dependabot security updates SHALL NOT be used to achieve it

### Requirement: Dependabot resolves the same package manager as CI
The Dependabot configuration and the repository metadata SHALL cause Dependabot to use the same pnpm major version as the CI workflows.

#### Scenario: pnpm version declared
- **WHEN** Dependabot prepares an npm ecosystem update
- **THEN** it SHALL resolve the pnpm version declared in `package.json` `engines.pnpm`, matching the version installed by the PR workflow

#### Scenario: Update run fails to resolve
- **WHEN** a Dependabot run reports `security_update_not_possible` or a manager mismatch
- **THEN** the failure SHALL be investigated against the run log rather than assumed resolved by configuration alone
