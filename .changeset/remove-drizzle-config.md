---
'@pixpilot/antfu-eslint-config': major
---

Remove the built-in Drizzle ORM config. The `drizzle` option, the `OptionsDrizzle` type, the exported `drizzle()` config and the `drizzle/*` rules are gone.

They now live in `@pixpilot/drizzle-config`, which `@pixpilot/eslint-config` loads lazily behind its own `drizzle` option. To keep the rules when using this config directly, install `@pixpilot/drizzle-config` and spread `drizzleConfigs()` into your config.
