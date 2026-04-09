import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  ignores: [
    '**/migrations/*',
  ],
  gitignore: true,
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },
  typescript: true,
  jsonc: false,
  yaml: false,
  rules: {
    'ts/consistent-type-definitions': ['error', 'type'],
    'no-console': ['warn'],
    'antfu/consistent-chaining': 'off',
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
    'dot-location': ['error', 'property'],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: {
          multiline: true,
          minProperties: 2,
        },
        ObjectPattern: { multiline: true },
        ImportDeclaration: 'never',
        ExportDeclaration: {
          multiline: true,
          minProperties: 2,
        },
      },
    ],
    'no-return-await': 'error',
    'antfu/no-top-level-await': ['off'],
    'node/prefer-global/process': ['off'],
    'node/no-process-env': ['error'],
    'unicorn/filename-case': ['error', {
      case: 'kebabCase',
      ignore: ['README.md'],
    }],
  },
})
