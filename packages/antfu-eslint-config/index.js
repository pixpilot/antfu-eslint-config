// This package exists to provide a workspace alias for @antfu/eslint-config.
// It re-exports @pixpilot/eslint-config so that test fixtures and configs that import
// @antfu/eslint-config (as in the upstream repo) will work without modification.
// This allows us to keep our fork compatible with upstream and merge changes easily.
// See README.md for more details.

// Re-export everything from @pixpilot/eslint-config
export * from '@pixpilot/eslint-config'
export { default } from '@pixpilot/eslint-config'
