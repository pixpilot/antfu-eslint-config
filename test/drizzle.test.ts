import type { OptionsConfig } from '../src/types'

import { ESLint } from 'eslint'
import { describe, expect, it, vi } from 'vitest'

const baseOptions: OptionsConfig = {
  astro: false,
  formatters: false,
  imports: false,
  jsx: false,
  jsonc: false,
  markdown: false,
  nextjs: false,
  react: false,
  solid: false,
  stylistic: false,
  svelte: false,
  test: false,
  toml: false,
  typescript: false,
  unocss: false,
  unicorn: false,
  vue: false,
  yaml: false,
}

async function createESLint(options: OptionsConfig) {
  const { antfu } = await import('../src')
  const configs = await antfu({
    ...baseOptions,
    ...options,
  })

  return new ESLint({
    overrideConfig: configs as any,
    overrideConfigFile: true,
  })
}

describe('drizzle rules', () => {
  it('reports timestamp() without withTimezone', async () => {
    const eslint = await createESLint({ drizzle: true })
    const code = `
      import { timestamp } from 'drizzle-orm/pg-core'
      const createdAt = timestamp('created_at')
    `

    const [result] = await eslint.lintText(code, { filePath: 'schema.js' })
    const drizzleErrors = result.messages.filter(msg => msg.ruleId === 'drizzle/prefer-timestamptz')

    expect(drizzleErrors).toHaveLength(1)
  })

  it('reports timestamp() with withTimezone: false', async () => {
    const eslint = await createESLint({ drizzle: true })
    const code = `
      import { timestamp as ts } from 'drizzle-orm/pg-core'
      const createdAt = ts('created_at', { withTimezone: false })
    `

    const [result] = await eslint.lintText(code, { filePath: 'schema.js' })
    const drizzleErrors = result.messages.filter(msg => msg.ruleId === 'drizzle/prefer-timestamptz')

    expect(drizzleErrors).toHaveLength(1)
  })

  it('allows timestamp() with withTimezone: true', async () => {
    const eslint = await createESLint({ drizzle: true })
    const code = `
      import { timestamp } from 'drizzle-orm/pg-core'
      const createdAt = timestamp('created_at', { withTimezone: true })
    `

    const [result] = await eslint.lintText(code, { filePath: 'schema.js' })
    const drizzleErrors = result.messages.filter(msg => msg.ruleId?.startsWith('drizzle/'))

    expect(drizzleErrors).toHaveLength(0)
  })

  it('reports pgTable() without enableRLS()', async () => {
    const eslint = await createESLint({ drizzle: true })
    const code = `
      import { pgTable } from 'drizzle-orm/pg-core'
      const users = pgTable('users', {})
    `

    const [result] = await eslint.lintText(code, { filePath: 'schema.js' })
    const drizzleErrors = result.messages.filter(msg => msg.ruleId === 'drizzle/require-enable-rls')

    expect(drizzleErrors).toHaveLength(1)
  })

  it('allows pgTable().enableRLS()', async () => {
    const eslint = await createESLint({ drizzle: true })
    const code = `
      import { pgTable } from 'drizzle-orm/pg-core'
      const users = pgTable('users', {}).enableRLS()
    `

    const [result] = await eslint.lintText(code, { filePath: 'schema.js' })
    const drizzleErrors = result.messages.filter(msg => msg.ruleId?.startsWith('drizzle/'))

    expect(drizzleErrors).toHaveLength(0)
  })

  it('auto-enables drizzle when drizzle-orm is installed', async () => {
    vi.resetModules()
    vi.doMock('local-pkg', async () => {
      const actual = await vi.importActual<typeof import('local-pkg')>('local-pkg')
      return {
        ...actual,
        isPackageExists(name: string, options?: { paths?: string[] }) {
          if (name === 'drizzle-orm')
            return true
          return actual.isPackageExists(name, options)
        },
      }
    })

    const { antfu } = await import('../src/factory')
    const configs = await antfu(baseOptions)
    const hasDrizzleConfig = configs.some(config => config.name === 'antfu/drizzle/rules')

    expect(hasDrizzleConfig).toBe(true)

    vi.doUnmock('local-pkg')
    vi.resetModules()
  })
})
