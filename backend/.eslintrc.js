module.exports = {
  extends: [
    '../.eslintrc.js',
  ],
  env: {
    node: true,
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'max-lines': ['error', {
      max: 500,
      skipBlankLines: true,
      skipComments: true
    }],
  },
};
