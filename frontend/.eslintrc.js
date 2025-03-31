module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'react-app',
    'react-app/jest',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Combined rules from both files
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'max-lines': ['error', {
      max: 500,
      skipBlankLines: true,
      skipComments: true
    }],
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
