import { describe, expect, it } from 'vitest'
import { react } from '../src/configs/react'

describe('react configurations', () => {
  it('should use modern React plugin by default', async () => {
    const configs = await react()

    // Should contain modern React plugin setup
    const setupConfig = configs.find(config => config.name === 'antfu/react-modern/setup')
    expect(setupConfig).toBeDefined()
    expect(setupConfig?.plugins).toBeDefined()
    expect(setupConfig?.plugins?.react).toBeDefined()
    expect(setupConfig?.plugins?.['react-dom']).toBeDefined()
    expect(setupConfig?.plugins?.['react-hooks-extra']).toBeDefined()
  })

  it('should use legacy React plugin when specified', async () => {
    const configs = await react({ package: 'eslint-plugin-react' })

    // Should contain legacy React plugin setup
    const setupConfig = configs.find(config => config.name === 'antfu/react-legacy/setup')
    expect(setupConfig).toBeDefined()
    expect(setupConfig?.plugins).toBeDefined()
    expect(setupConfig?.plugins?.react).toBeDefined()
    expect(setupConfig?.plugins?.['react-hooks']).toBeDefined()
    expect(setupConfig?.plugins?.['react-refresh']).toBeDefined()

    // Should not have the modern-specific plugins
    expect(setupConfig?.plugins?.['react-dom']).toBeUndefined()
    expect(setupConfig?.plugins?.['react-hooks-extra']).toBeUndefined()
  })

  it('should pass through other options correctly', async () => {
    const configs = await react({
      package: '@eslint-react/eslint-plugin',
      files: ['custom/**/*.{jsx,tsx}'],
      overrides: {
        'react/jsx-key': 'off',
      },
    })

    const rulesConfig = configs.find(config => config.name === 'antfu/react-modern/rules')
    expect(rulesConfig).toBeDefined()
    expect(rulesConfig?.files).toEqual(['custom/**/*.{jsx,tsx}'])
    expect(rulesConfig?.rules?.['react/jsx-key']).toBe('off')
  })
})
