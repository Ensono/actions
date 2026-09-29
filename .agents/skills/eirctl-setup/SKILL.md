---
name: eirctl-setup
description: Use the Ensono eirctl-setup GitHub Action to install the eirctl CLI in a GitHub Actions job, including pinned or prerelease versions.
---

# Set up eirctl

Use `Ensono/actions/eirctl-setup@<pinned-ref>` (or `./eirctl-setup` after checkout) before steps that invoke `eirctl`. The action downloads the binary for the runner's OS/architecture and adds it to `PATH` for later steps.

```yaml
- uses: Ensono/actions/eirctl-setup@<pinned-ref>
  with:
    version: 2.0.0
    sha256: <expected-binary-sha256>
- run: eirctl -v
```

`version` defaults to `latest`; prefer a pinned release and independently verified SHA-256 digest for reproducible, verified downloads. A `sha256` input is required for any non-`latest` version and when `isPrerelease: 'true'`; set `isPrerelease` to select a prerelease (with `version: latest` for the newest prerelease). See `eirctl-setup/action.yml` for inputs.
