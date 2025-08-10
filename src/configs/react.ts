/* eslint-disable perfectionist/sort-objects */
import type { OptionsFiles, OptionsOverrides, OptionsReact, OptionsTypeScriptParserOptions, OptionsTypeScriptWithTypes, TypedFlatConfigItem } from '../types'

import { isPackageExists } from 'local-pkg'
import { GLOB_ASTRO_TS, GLOB_JSX, GLOB_MARKDOWN, GLOB_SRC, GLOB_TS, GLOB_TSX } from '../globs'
import { ensurePackages, interopDefault } from '../utils'
import { reactLegacyRules, reactLegacyTypeScriptRules } from './react-legacy'
import { reactModernRules, reactModernTypeAwareRules } from './react-modern'

// react refresh
const ReactRefreshAllowConstantExportPackages = [
  'vite',
]
const RemixPackages = [
  '@remix-run/node',
  '@remix-run/react',
  '@remix-run/serve',
  '@remix-run/dev',
]
const ReactRouterPackages = [
  '@react-router/node',
  '@react-router/react',
  '@react-router/serve',
  '@react-router/dev',
]
const NextJsPackages = [
  'next',
]

export async function react(
  options: OptionsTypeScriptParserOptions & OptionsTypeScriptWithTypes & OptionsOverrides & OptionsFiles & OptionsReact = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    package: reactPackage = '@eslint-react/eslint-plugin',
    files = reactPackage === 'eslint-plugin-react' ? [GLOB_JSX, GLOB_TSX] : [GLOB_SRC],
    filesTypeAware = [GLOB_TS, GLOB_TSX],
    ignoresTypeAware = [
      `${GLOB_MARKDOWN}/**`,
      GLOB_ASTRO_TS,
    ],
    overrides = {},
    tsconfigPath,
  } = options

  const isModern = reactPackage === '@eslint-react/eslint-plugin'
  const isTypeAware = !!tsconfigPath

  await ensurePackages([
    reactPackage,
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
  ])

  const [
    pluginReact,
    pluginReactHooks,
    pluginReactRefresh,
  ] = await Promise.all([
    interopDefault(import(reactPackage)),
    interopDefault(import('eslint-plugin-react-hooks')),
    interopDefault(import('eslint-plugin-react-refresh')),
  ] as const)

  const isAllowConstantExport = ReactRefreshAllowConstantExportPackages.some(i => isPackageExists(i))
  const isUsingRemix = RemixPackages.some(i => isPackageExists(i))
  const isUsingReactRouter = ReactRouterPackages.some(i => isPackageExists(i))
  const isUsingNext = NextJsPackages.some(i => isPackageExists(i))

  // Setup plugins based on package type
  const plugins = isModern
    ? {
        'react': pluginReact.configs.all.plugins['@eslint-react'],
        'react-dom': pluginReact.configs.all.plugins['@eslint-react/dom'],
        'react-hooks': pluginReactHooks,
        'react-hooks-extra': pluginReact.configs.all.plugins['@eslint-react/hooks-extra'],
        'react-naming-convention': pluginReact.configs.all.plugins['@eslint-react/naming-convention'],
        'react-refresh': pluginReactRefresh,
        'react-web-api': pluginReact.configs.all.plugins['@eslint-react/web-api'],
      }
    : {
        'react': pluginReact,
        'react-hooks': pluginReactHooks,
        'react-refresh': pluginReactRefresh,
      }

  // Get base rules based on package type
  const baseRules = isModern ? reactModernRules : reactLegacyRules

  // React refresh configuration
  const reactRefreshRule: TypedFlatConfigItem['rules'] = {
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: isAllowConstantExport,
        allowExportNames: [
          ...(isUsingNext
            ? [
                'dynamic',
                'dynamicParams',
                'revalidate',
                'fetchCache',
                'runtime',
                'preferredRegion',
                'maxDuration',
                'config',
                'generateStaticParams',
                'metadata',
                'generateMetadata',
                'viewport',
                'generateViewport',
              ]
            : []),
          ...(isUsingRemix || isUsingReactRouter
            ? [
                'meta',
                'links',
                'headers',
                'loader',
                'action',
                'clientLoader',
                'clientAction',
                'handle',
                'shouldRevalidate',
              ]
            : []),
        ],
      },
    ],
  }

  const configs: TypedFlatConfigItem[] = [
    {
      name: `antfu/react-${isModern ? 'modern' : 'legacy'}/setup`,
      plugins,
      ...(!isModern && {
        settings: {
          react: {
            version: 'detect',
          },
        },
      }),
    },
    {
      files,
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
        sourceType: 'module',
      },
      name: `antfu/react-${isModern ? 'modern' : 'legacy'}/rules`,
      rules: {
        // recommended rules react-hooks
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',

        ...baseRules,
        ...reactRefreshRule,
        ...(!isModern && isTypeAware && reactLegacyTypeScriptRules),
        ...overrides,
      },
    },
  ]

  // Add type-aware rules for modern React plugin
  if (isModern && isTypeAware) {
    configs.push({
      files: filesTypeAware,
      ignores: ignoresTypeAware,
      name: 'antfu/react-modern/type-aware-rules',
      rules: {
        ...reactModernTypeAwareRules,
      },
    })
  }

  return configs
}
