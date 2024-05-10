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
- Typescript 5.x

### Install

In the root run the below:

- `npm install -g pnpm@9.1.0`

Once we have these 2 installed we can use pnpm for everything, see the [pnpm-workspace.yaml](./pnpm-workspace.yaml) for details on how the workspace lookups are organised.

```sh
pnpm i
```

To run the tests in all the tasks

```sh
pnpm run test
```

To run the build of all the tasks

```sh
pnpm run build
```

### Notes


## Current tasks

- process-json


## Adding a Task

There are various components in adding a task to this extension.

A Task is a "small" program written in Typescript that expects an input, this input is defined in a task.json file and an output which is set as a result enum with an optional message from the task itself.

An Example is left in the .github/actions folder under `.github/actions/playground-echo`, inspection of that folder will provide a structure for all subsequent tasks.

### Step 1

Firstly create a folder inside `.github/actions` e.g. `.github/actions/my-awesome-foo`

```bash
mkdir -p .github/actions/my-awesome-foo && cd .github/actions/my-awesome-foo
pnpm init -y --scope=@ensono-task --name=my-awesome-foo
```

This will generate a skeleton package.json which is required

### Step 2

Create an action.yml

### Step 3 - write the task

Using typescript and a src as dir for all TS + tests (either colocated or in a separate `__tests__` directory as long as they are named *.test.ts)

copy over tsconfig.json/jest.config.js from `playground-echo` task, it will inherit all root level specs for both TS and Jest, with the ability to override.

Name your main file `src/index.ts` this should be minimal as you would need to use the TaskMockRunner to test it as it is self-invoking file

Adding any dependencies should always be installed via `pnpm i -D DEPNAME@0.0.1 --save-exact` and as devDependencies as the bundler will only take what it needs, `@SEMVER` can be omitted if you use `--save-exact`.

### Testing once published

See the [.github/workflows/tester.yml](./.github/workflows/tester.yml) for details on how to test it in YAML.

IF a task outputs a variable - there is a slightly different way to pick it up:
- within the same job 
- across different jobs

## Publishing multiple versions
