![Code Coverage](https://img.shields.io/badge/Code%20Coverage-98%25-success?style=flat)

# Ensono Github Actions

Collection of GHA custom actions.

## Set up

The repo set up has been modified to suit the below setup. General overview/guidance on JS tasks can be found in [this doc](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)


__Components__: 

- Using Jest
- Setting up as a monorepo with the ability to [add multiple tasks](#adding-a-task)
- Use [esbuild](https://esbuild.github.io/) for bundling and generating a single deployable file
    - speeds up deployments 
    - allows for multiple tasks within the same extension as there is a 50MB limit (bundled tasks is about 400kb) as opposed to 10MB+ depending on dependencies used.
- [pnpm](https://pnpm.io/)
    - using workspaces also allows for easy lib sharing across different tasks - coupled with a bundler
    - workspace level dependency lock-file
- Native TypeScript 7 for compilation and source-and-test type checking
- SWC for TypeScript-to-ESM Jest transformation (it does **not** type-check)
- Oxlint for correctness-focused linting, included as hardening in this change

### Install

Use Node 24 and the repository/CI-pinned pnpm version:

```sh
npm install -g pnpm@12.11.2 --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

See [pnpm-workspace.yaml](./pnpm-workspace.yaml) for workspace discovery and the reviewed dependency-build policy. Native SWC and Oxlint packages work without install hooks on the verified Linux x64/glibc platform. SWC's network-capable WASM fallback hook is deliberately denied; other platforms must provide a supported native optional package rather than enabling scripts globally. The pnpm-only release-age exception, parent-scoped coverage-tooling YAML security override, and temporary actionlint compatibility-build evidence are recorded in [SECURITY-REMEDIATION.md](./SECURITY-REMEDIATION.md).

### Local verification

Run the following sequence under Node 24, with builds, linters, and tests isolated from credentials and network access:

```sh
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:merge
```

- **TypeScript 7** is the authoritative native compiler/checker. `typecheck` explicitly builds shared-library declarations first, checks all four production configurations without emitting, then checks their source and tests through `tsconfig.jest.json`. Test exclusions are overridden; generated artifacts are not additional source roots (library declarations are consumed as package types).
- **SWC** strips/transforms TypeScript into ESM for **Jest 30**, which executes tests with VM modules, dynamic-import mocks, existing coverage thresholds, and JUnit reporting. Successful transformation is not a type check.
- **Oxlint** enforces standard correctness rules, including Jest correctness checks, and fails on any error or warning. It does not replace native compiler checking, enable type-aware linting, or perform a formatting migration. `lint` covers authored TypeScript/JavaScript throughout the repository: all workspace source/tests, `.tests/inputs.ts`, Jest configurations, `.testEnv.js` helpers, and `output-report.js`. Node globals are available; Jest globals are scoped to tests/helpers. Generated `task.js`, `dist`/`build` outputs, dependencies, and coverage directories are explicitly excluded. No rule exceptions are required for the current baseline.
- **esbuild** produces each action's CommonJS bundle with explicit `--target=node24`. Consumers run the committed JavaScript with `using: node24`, not the compiler. Commit reproducible bundle/declaration changes whenever a build changes tracked outputs.

When changing dependencies, query npm for compatible stable versions at least five days old and supply `--config.minimumReleaseAge=7200` only on the install/update command; never persist the delay. pnpm 12.11.2's pre-run verification compares this setting with the installation. If that install used the flag, pass the same one-time flag on subsequent validation commands (for example `pnpm --config.minimumReleaseAge=7200 run typecheck`), or perform a normal frozen installation as above. Do not disable dependency verification. Isolated runners may use `--config.verifyDepsBeforeRun=error` to prevent automatic host-style installation attempts.

### Notes


## Current tasks

- [process-json](./process-json/README.md)
- [eirctl-setup](./eirctl-setup/README.md)

## Adding a Task

There are various components in adding a task to this extension.

A Task is a "small" program written in Typescript that expects an input, this input is defined in a task.json file and an output which is set as a result enum with an optional message from the task itself.

An Example is left in the .github/actions folder under `.github/actions/playground-echo`, inspection of that folder will provide a structure for all subsequent tasks.

### Step 1

Firstly create a folder inside the root of the repo e.g. `my-awesome-foo`, this will be where your task lives.

```bash
mkdir -p my-awesome-foo && cd my-awesome-foo
pnpm init -y --scope=@ensono-actions --name=my-awesome-foo
```

This will generate a skeleton package.json which is required

### Step 2

Create an action.yml

### Step 3 - write the task

Using typescript and a src as dir for all TS + tests (either colocated or in a separate `__tests__` directory as long as they are named *.test.ts)

copy over tsconfig.json/jest.config.js from `playground-echo` task, it will inherit all root level specs for both TS and Jest, with the ability to override.

Name your main file `src/index.ts` this should be minimal as all it needs to inlcude is the method call to your task. See existing tasks for examples of both sync and async actions.

Adding any dependencies should always be installed via `pnpm i -D DEPNAME@0.0.1 --save-exact` and as devDependencies as the bundler will only take what it needs, `@SEMVER` can be omitted if you use `--save-exact`.

### Testing once published

See the [.github/workflows/tester.yml](./.github/workflows/tester.yml) for details on how to test it in YAML.

IF a task outputs a variable - there is a slightly different way to pick it up:
- within the same job 
- across different jobs
