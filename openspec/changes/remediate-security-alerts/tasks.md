## 1. Dependency verification

- [x] 1.1 Confirm the working tree is on `fix/update-actions` and clean, and record the current direct dependency versions from `package.json` and each workspace `package.json` (tracked tree clean; untracked OpenSpec planning files authorized by user)
- [x] 1.2 Query the npm registry for every direct package name and record latest stable version plus publish date
- [x] 1.3 Select versions per the five-day release-age rule; note the compatibility exceptions (TypeScript `6.0.3` vs `ts-jest` `<7` peer range, `@types/node` on the Node 24 runtime line, `ts-jest` `29.4.13`)
- [x] 1.4 Apply any version corrections to `package.json` files (no manual lockfile edits)

## 2. Lockfile and bundles

- [x] 2.1 Add `engines.pnpm` to the root `package.json` matching the pnpm version installed by CI
- [x] 2.2 Regenerate and dedupe `pnpm-lock.yaml` with pnpm 12.6.0 using the one-time flag `--config.minimumReleaseAge=7200`
- [x] 2.3 Verify the flag was not persisted to `package.json`, `.npmrc`, or `pnpm-workspace.yaml`, and that `pnpm.overrides` remains empty
- [x] 2.4 Run `pnpm run build` and commit any resulting changes to the checked-in `*/task.js` bundles (build produced no bundle changes)
- [x] 2.5 Run `pnpm run test` and `pnpm run test:merge`; confirm all suites pass

## 3. Supply-chain verification

- [x] 3.1 Run `pnpm install --frozen-lockfile --config.minimumReleaseAge=7200` on pnpm 12.6.0 and confirm it passes without modifying the lockfile
- [x] 3.2 Run `pnpm audit --json` and confirm zero vulnerabilities
- [x] 3.3 Compare the new lockfile against all 30 original Dependabot alert version ranges with semver; confirm zero matches and that `braces` is absent
- [x] 3.4 Run `git diff --check` and confirm a clean result

## 4. Workflow hardening

- [x] 4.1 Add `permissions: contents: read` to `.github/workflows/tester.yml` and remove its empty `env: {}` map
- [x] 4.2 Replace the `actions/checkout@v4` tag references in `tester.yml` with the SHA pin used elsewhere in the repository, with a trailing version comment
- [x] 4.3 Fix the unterminated quotes in the `Set Version` step of `.github/workflows/release.yml`
- [x] 4.4 Resolve the shellcheck style warnings in `.github/workflows/pr.yml`
- [x] 4.5 Run `actionlint` across all workflows and confirm it exits zero

## 5. Dependabot configuration

- [x] 5.1 Create `.github/dependabot.yml` with weekly `npm` and `github-actions` update schedules
- [x] 5.2 Configure npm groups: runtime version updates, development version updates, and security updates as separate groups; group Actions updates as one
- [x] 5.3 Configure a five-day cooldown on version updates only, and add a comment recording that GitHub does not apply cooldown to security updates and that immediate security updates are the deliberate choice
- [x] 5.4 Validate the YAML parses and the group/cooldown structure matches the Dependabot options reference (GitHub-hosted execution still needs verification for pnpm 12)

## 6. Documentation and triage record

- [x] 6.1 Write `SECURITY-REMEDIATION.md` covering the version-selection policy, the documented exceptions, and the verification evidence produced in sections 2–5
- [x] 6.2 Record the `js/weak-cryptographic-algorithm` justification: SHA-1 over the fixed public RFC 6455 GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` in bundled Undici, not secret data; SHA-256 substitution is rejected
- [x] 6.3 State explicitly in the record that the three CodeQL alerts must not be dismissed until each trace is reviewed in the GitHub UI

## 7. Delivery

- [x] 7.1 Run `pre-commit run --all-files` if configured, and review the full diff (no pre-commit configuration present)
- [x] 7.2 Commit with a signed conventional commit and push to `fix/update-actions` (PR #7); prompt the user to retry if GPG signing fails
- [x] 7.3 Confirm the PR workflow's build-integrity, test, and coverage steps pass

## 8. Post-merge verification

- [ ] 8.1 After merge, re-check Dependabot alerts on `main` and record which of the 30 closed and which remain
- [ ] 8.2 Review each of the three `js/weak-cryptographic-algorithm` traces in the GitHub UI and dismiss as false positive with the recorded reason only if the trace confirms the handshake path
- [ ] 8.3 Confirm CodeQL closes the three `actions/missing-workflow-permissions` alerts
- [ ] 8.4 Retry the previously failed Dependabot security-update runs and record outcomes; raise follow-ups for any still reporting `security_update_not_possible`
