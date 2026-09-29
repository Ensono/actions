---
name: playground-echo
description: Use the Ensono playground-echo GitHub Action only as a local example when testing or learning how this repository's action inputs work.
---

# Playground echo action

This is a demo action, not a general-purpose echo step. After checkout, use it to exercise the sample inputs:

```yaml
- uses: ./playground-echo
  with:
    input1: hello
    input2StrArrComma: one,two
    inputBool: 'false'
```

`input1` and `input2StrArrComma` are declared required in `playground-echo/action.yml`; `inputBool` defaults to `false`. The action parses inputs and emits debug configuration, but does **not** set outputs or print a normal echo result. Do not pass secrets as demo inputs. For production logging, use a regular workflow `run` step instead.
