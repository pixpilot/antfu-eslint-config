# Package Name Fork Solution

This document explains how to maintain test compatibility when forking `@antfu/eslint-config` and changing the package name to `@pixpilot/eslint-config`.

## Problem

When you fork the original `@antfu/eslint-config` repository and change the package name in `package.json` to `@pixpilot/eslint-config`, the test fixtures fail because they still import `@antfu/eslint-config`.

## Solution: Workspace Package Alias

Instead of changing all test references (which would make merging upstream changes difficult), we create a **workspace package** that acts as an alias, redirecting `@antfu/eslint-config` imports to our local `@pixpilot/eslint-config` build.

### How It Works

1. **Main package**: Your `@pixpilot/eslint-config` builds to `dist/`
2. **Workspace alias**: `packages/antfu-eslint-config/` contains a package named `@antfu/eslint-config` that re-exports your main package
3. **PNPM workspace**: Both packages are part of the same workspace with `@antfu/eslint-config: workspace:*` dependency
4. **Tests work**: Test fixtures import `@antfu/eslint-config` but get your `@pixpilot/eslint-config` code

### File Structure

```
eslint-config/
├── packages/
│   └── antfu-eslint-config/
│       ├── package.json          # {"name": "@antfu/eslint-config"}
│       └── index.js              # Re-exports @pixpilot/eslint-config
├── pnpm-workspace.yaml           # includes "packages/*"
├── package.json                  # "@antfu/eslint-config": "workspace:*"
└── dist/                         # Your built @pixpilot/eslint-config
```

### Setup

The workspace package is already set up in this repository. Simply:

```bash
# Install workspace dependencies
pnpm install

# Build your package
pnpm build

# Run tests (they'll work automatically!)
pnpm test
```

### Benefits

1. **Native PNPM support** - Uses official workspace features, no hacks
2. **No code changes** - Test files remain exactly as upstream
3. **Easy merges** - No conflicts when pulling upstream changes
4. **Version controlled** - The alias package is tracked in git, ensuring consistency
5. **Clean dependency graph** - PNPM properly manages the workspace dependency
6. **No manual setup** - Works automatically after `pnpm install`

### Configuration Details

**pnpm-workspace.yaml:**

```yaml
packages:
  - fixtures/*
  - packages/* # Includes our alias package
```

**Main package.json devDependencies:**

```json
{
  "devDependencies": {
    "@antfu/eslint-config": "workspace:*"
  }
}
```

**Alias package (packages/antfu-eslint-config/package.json):**

```json
{
  "name": "@antfu/eslint-config",
  "dependencies": {
    "@pixpilot/eslint-config": "workspace:*"
  }
}
```

**Alias index.js:**

```javascript
export * from '@pixpilot/eslint-config'
export { default } from '@pixpilot/eslint-config'
```

### Integration with CI/CD

No special setup needed! Standard workflow:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Build package
  run: pnpm build

- name: Run tests
  run: pnpm test
```

### Alternative Solutions Considered

1. **Manual node_modules alias**: Works but not version controlled, requires scripts
2. **PNPM Package Resolutions**: Doesn't work because test fixtures run in isolated directories
3. **Symlinks**: Platform-specific and could cause issues in CI/CD
4. **Changing test imports**: Would make upstream merges difficult

### Maintenance

- **Zero maintenance** - The workspace package is committed and works automatically
- **Upstream merges** - No conflicts since test files remain unchanged
- **New contributors** - Just run `pnpm install && pnpm build && pnpm test`

This solution provides the cleanest, most maintainable approach to keeping your fork's tests working while preserving upstream compatibility.
