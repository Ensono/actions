## ADDED Requirements

### Requirement: Every workflow declares least-privilege permissions
Each workflow in `.github/workflows/` SHALL declare an explicit `permissions` block granting only the scopes its jobs require, so that code scanning reports no `actions/missing-workflow-permissions` finding.

#### Scenario: Workflow only reads repository contents
- **WHEN** a workflow's jobs only check out code and run builds or tests
- **THEN** the workflow SHALL declare `permissions: contents: read`

#### Scenario: New workflow or job is added
- **WHEN** a workflow or job is added without an explicit `permissions` block
- **THEN** code scanning SHALL raise `actions/missing-workflow-permissions` and the change SHALL NOT be merged until permissions are declared

#### Scenario: Elevated scope is required
- **WHEN** a job needs a write scope (for example tagging a release)
- **THEN** only that scope SHALL be granted, at the narrowest level that works

### Requirement: Workflows pass actionlint
All workflow files SHALL parse cleanly and pass `actionlint`, including its shellcheck-backed `run:` script checks.

#### Scenario: Linting the repository
- **WHEN** `actionlint` is run across `.github/workflows/`
- **THEN** it SHALL exit zero with no errors or warnings

#### Scenario: Malformed shell in a run block
- **WHEN** a `run:` block contains unterminated quotes or an unquoted expansion
- **THEN** it SHALL be corrected before merge rather than suppressed

### Requirement: Workflows contain no dead configuration
Workflow definitions SHALL NOT carry empty or unused configuration maps.

#### Scenario: Empty env map
- **WHEN** a job declares `env: {}` with no variables
- **THEN** the key SHALL be removed

### Requirement: Third-party actions are pinned to a commit SHA
Workflow steps that consume actions outside this repository SHALL reference an immutable commit SHA with the human-readable version in a trailing comment.

#### Scenario: Adding or updating an external action
- **WHEN** a step references a third-party action
- **THEN** the reference SHALL be `owner/repo@<40-char-sha> # vX.Y.Z`

#### Scenario: Mutable tag reference
- **WHEN** a step references an action by a floating tag such as `@v4`
- **THEN** it SHALL be replaced with the corresponding commit SHA
