---
name: eirctl-setup
description: Use the Ensono eirctl-setup GitHub Action to install the eirctl CLI in a GitHub Actions job, including pinned or prerelease versions.
---

# Set up eirctl

Use `Ensono/actions/eirctl-setup@<pinned-ref>` (or `./eirctl-setup` after checkout) before steps that invoke `eirctl`. The action downloads the binary for the runner's OS/architecture and adds it to `PATH` for later steps.

```yaml
- uses: Ensono/actions/eirctl-setup@<pinned-ref>
  with:
    version: v0.11.27
    sha256: a9f875ec6964341756ce82c1aa808377615d7f569c4e68a6adb07ac2d8527270 # linux-amd64 only
- run: eirctl -v
```

The example uses the published `v0.11.27` release and its Linux amd64 asset digest; use the matching digest for other runner platforms. `version` defaults to `latest`; prefer a pinned release and independently verified SHA-256 digest for reproducible, verified downloads. A `sha256` input is required for any non-`latest` version and when `isPrerelease: 'true'`; set `isPrerelease` to select a prerelease (with `version: latest` for the newest prerelease). See `eirctl-setup/action.yml` for inputs.
