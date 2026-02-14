module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
};