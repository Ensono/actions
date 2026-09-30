---
name: process-json
description: Use the Ensono process-json GitHub Action to flatten JSON or Terraform outputs into step outputs and environment variables in a workflow.
---

# Process JSON action

Use `Ensono/actions/process-json@<pinned-ref>` (or `./process-json` after checkout) when later workflow steps need individual values from a JSON object or Terraform output file.

```yaml
- uses: Ensono/actions/process-json@<pinned-ref>
  id: json
  with:
    jsonStringOrPath: path/to/output.json # or a JSON string
    separator: __                     # default
    isTerraformOutput: 'true'          # only for Terraform output JSON
- run: echo '${{ steps.json.outputs.example__key }}'
```

Nested keys are joined with `separator`; each flattened leaf becomes a step output and an environment variable for subsequent steps. `markAllOutputAsSecret: 'true'` masks non-Terraform values; for Terraform output JSON, the top-level `sensitive` flag controls masking instead. Do not echo or expose sensitive values in expressions or logs. Reference actual flattened keys, not the declared `flattenedJson` output (the implementation does not set it). Check `process-json/action.yml` for inputs and `process-json/src/process-json.ts` for behavior.
