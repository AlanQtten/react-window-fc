module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off',
    'no-multi-assign': 'off',
    'no-nested-ternary': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
  },
};
