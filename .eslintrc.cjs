module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },

    ecmaVersion: 2023,
    sourceType: 'module',
    project: ['./tsconfig.eslint.json'],
  },
  plugins: ['react-refresh', 'prettier'],
  // tips: 0 = 'off', 1 = 'warn', 2 = 'error'
  rules: {
    // ==================== native eslint ====================
    'no-restricted-syntax': 0,
    'no-plusplus': 0,
    'no-multi-assign': 0,
    'no-nested-ternary': 0,
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    // ==================== typescript ====================
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-unused-vars': 1,
    '@typescript-eslint/no-explicit-any': 0,
    // ==================== react related ====================
    'react/button-has-type': 0,
    'react/prop-types': 0,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/no-unused-prop-types': 0,
    'react/require-default-props': 0,
    'react/function-component-definition': 0,
    'react/jsx-props-no-spreading': 0,
    'react/no-unstable-nested-components': 0,
    // ==================== plugin:import ====================
    'import/prefer-default-export': 0,
    'import/no-extraneous-dependencies': 0,
  },
};
