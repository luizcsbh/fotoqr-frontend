module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['react-hooks'],
  rules: {
    // Hooks called conditionally / after an early return crash React at runtime
    'react-hooks/rules-of-hooks': 'error',
  },
};
