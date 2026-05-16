import type { Rule } from 'eslint'
import type { OptionsOverrides, TypedFlatConfigItem } from '../types'

const preferTimestamptzRule: Rule.RuleModule = {
  create(context) {
    const drizzleTimestampBindings = new Set<string>()

    return {
      CallExpression(node) {
        const calleeName = node.callee.type === 'Identifier'
          ? node.callee.name
          : null

        if (!calleeName || !drizzleTimestampBindings.has(calleeName))
          return

        if (node.arguments.length === 0) {
          context.report({ messageId: 'bareCall', node })
          return
        }

        const optionsArg = node.arguments.find(arg => arg.type === 'ObjectExpression')

        if (!optionsArg) {
          context.report({ messageId: 'useTimestamptz', node })
          return
        }

        const withTimezoneProperty = optionsArg.properties.find((prop) => {
          if (prop.type !== 'Property')
            return false

          if (prop.key.type === 'Identifier')
            return prop.key.name === 'withTimezone'

          return prop.key.type === 'Literal' && prop.key.value === 'withTimezone'
        })

        if (!withTimezoneProperty) {
          context.report({ messageId: 'useTimestamptz', node })
          return
        }

        if (withTimezoneProperty.type === 'Property'
          && withTimezoneProperty.value.type === 'Literal'
          && !withTimezoneProperty.value.value) {
          context.report({ messageId: 'useTimestamptz', node })
        }
      },
      ImportDeclaration(node) {
        if (
          node.source.type !== 'Literal'
          || node.source.value !== 'drizzle-orm/pg-core'
        ) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier'
            && specifier.imported.type === 'Identifier'
            && specifier.imported.name === 'timestamp'
          ) {
            drizzleTimestampBindings.add(specifier.local.name)
          }
        }
      },
    }
  },
  meta: {
    docs: {
      description:
        'Enforce withTimezone: true on timestamp() calls from drizzle-orm/pg-core.',
    },
    messages: {
      bareCall:
        'timestamp() called with no options. Use timestamptz() helper or pass { withTimezone: true }.',
      useTimestamptz:
        'timestamp() is missing { withTimezone: true }. Use your timestamptz() helper or add { withTimezone: true } explicitly.',
    },
    schema: [],
    type: 'problem',
  },
}

const requireEnableRlsRule: Rule.RuleModule = {
  create(context) {
    const drizzlePgTableBindings = new Set<string>()

    return {
      CallExpression(node) {
        const calleeName = node.callee.type === 'Identifier'
          ? node.callee.name
          : null

        if (!calleeName || !drizzlePgTableBindings.has(calleeName))
          return

        const parent = node.parent
        const isChainedWithRls
          = parent?.type === 'MemberExpression'
            && parent.property.type === 'Identifier'
            && parent.property.name === 'enableRLS'
            && parent.parent?.type === 'CallExpression'

        if (!isChainedWithRls)
          context.report({ messageId: 'missingRls', node })
      },
      ImportDeclaration(node) {
        if (
          node.source.type !== 'Literal'
          || node.source.value !== 'drizzle-orm/pg-core'
        ) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier'
            && specifier.imported.type === 'Identifier'
            && specifier.imported.name === 'pgTable'
          ) {
            drizzlePgTableBindings.add(specifier.local.name)
          }
        }
      },
    }
  },
  meta: {
    docs: {
      description:
        'Every pgTable() call must be chained with .enableRLS() for Supabase/Postgres RLS.',
    },
    messages: {
      missingRls: 'pgTable() is missing .enableRLS(). All tables must have Row Level Security enabled.',
    },
    schema: [],
    type: 'problem',
  },
}

const pluginDrizzle = {
  meta: {
    name: 'drizzle-database',
    version: '1.0.0',
  },
  rules: {
    'prefer-timestamptz': preferTimestamptzRule,
    'require-enable-rls': requireEnableRlsRule,
  },
}

export async function drizzle(
  options: OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const { overrides = {} } = options

  return [
    {
      name: 'antfu/drizzle/rules',
      plugins: {
        drizzle: pluginDrizzle,
      },
      rules: {
        'drizzle/prefer-timestamptz': 'error',
        'drizzle/require-enable-rls': 'error',
        ...overrides,
      },
    },
  ]
}
