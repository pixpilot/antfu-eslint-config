# @antfu/eslint-config (Workspace Alias)

**Purpose:**

This package exists solely to provide a workspace alias for `@antfu/eslint-config` within this forked monorepo.

## Why does this exist?

- The upstream project uses `@antfu/eslint-config` everywhere (including in test fixtures and configs).
- In this fork, the main package is renamed to `@pixpilot/antfu-eslint-config`.
- To avoid changing all test/config imports (which would make merging upstream changes difficult), we create this workspace package.
- This package simply re-exports everything from `@pixpilot/antfu-eslint-config`.
- This allows all code/tests that import `@antfu/eslint-config` to work as expected, while keeping the fork as close to upstream as possible.

## How does it work?

- This package is included in the workspace and listed as a devDependency using `workspace:*`.
- The `index.js` file re-exports everything from `@pixpilot/antfu-eslint-config`.
- When code or tests import `@antfu/eslint-config`, they transparently get the forked config.

## When should you touch this?

- **Do not** add any logic or configuration here. This package is only for aliasing.
- If the main package name changes, update the re-export in `index.js` and the dependency in `package.json`.

## More info

See the root `FORK_TESTING_SOLUTION.md` for a full explanation of this approach and why it is the best way to keep your fork compatible with upstream while using a custom package name.
