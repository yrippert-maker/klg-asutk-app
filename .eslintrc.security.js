module.exports = {
  rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-console': 'warn',
    'no-debugger': 'error'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-implied-eval': 'error'
      }
    }
  ]
}