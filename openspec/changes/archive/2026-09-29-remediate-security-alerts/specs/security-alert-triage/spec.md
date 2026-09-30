## ADDED Requirements

### Requirement: Scanner findings are dismissed only with verified evidence
A code scanning alert SHALL normally be dismissed only after its trace has been inspected in the GitHub UI and a written justification has been recorded on the dismissal. A narrow, explicit maintainer-approved exception for identified alerts MAY use equivalent documented source and alert-instance evidence.

#### Scenario: Suspected false positive
- **WHEN** an alert is believed to be a false positive without a specifically approved evidence exception
- **THEN** the alert trace SHALL be reviewed in the GitHub UI before any dismissal

#### Scenario: Dismissal without verified evidence
- **WHEN** an alert has not been reviewed in the GitHub UI and has no documented, maintainer-approved alternative evidence
- **THEN** it SHALL NOT be dismissed, regardless of an offline analysis reaching the same conclusion

#### Scenario: Approved `gh` evidence exception for alerts #4–6
- **WHEN** the maintainer expressly accepts the `gh` alert-instance locations and inspection of each corresponding `main` bundle as sufficient for these three findings
- **THEN** the false-positive dismissals SHALL state the protocol-mandated SHA-1 reason, and the record SHALL disclose that full UI traces were not reviewed; this exception SHALL NOT apply to other alerts

#### Scenario: Recording the reason
- **WHEN** an alert is dismissed as a false positive
- **THEN** the dismissal comment SHALL state the specific reason and SHALL be mirrored in `SECURITY-REMEDIATION.md`

### Requirement: Protocol-mandated cryptography is not "fixed"
Findings that flag a hash algorithm mandated by a wire protocol over non-secret data SHALL be triaged as false positives rather than remediated by substituting a different algorithm.

#### Scenario: WebSocket handshake SHA-1
- **WHEN** `js/weak-cryptographic-algorithm` flags the RFC 6455 WebSocket handshake in a bundled `task.js`, where SHA-1 is computed over the WebSocket key plus fixed public GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`
- **THEN** the finding SHALL be dismissed as a false positive with that reason recorded

#### Scenario: Attempted algorithm substitution
- **WHEN** replacing the handshake SHA-1 with SHA-256 is proposed
- **THEN** it SHALL be rejected because it would break protocol conformance

### Requirement: Alert closure is confirmed on the default branch
Scanner alert closure SHALL be claimed only after scanners rerun on `main` and the corresponding alerts are observed closed. Archiving the implementation change before merge SHALL NOT be represented as proof of scanner closure; outstanding checks remain documented.

#### Scenario: Changes merged
- **WHEN** the remediation lands on `main`
- **THEN** Dependabot and code scanning results SHALL be re-checked and the closed and remaining alerts recorded

#### Scenario: Alerts still open after merge
- **WHEN** an alert remains open after the scanners rerun
- **THEN** the residual risk SHALL be recorded and a follow-up action raised, and the alert SHALL NOT be assumed stale

#### Scenario: Previously failing security-update runs
- **WHEN** Dependabot security-update runs had failed with `security_update_not_possible` before the change
- **THEN** those runs SHALL be retried after merge and their outcome recorded, without assuming configuration alone fixed them
